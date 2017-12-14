bot.library(require('./contact'));
bot.library(require('./information-access-request'));
bot.library(require('./first_mission/conclusion'));
bot.library(require('./first_mission/assign'));
bot.library(require('./second_mission/assign'));
bot.library(require('./second_mission/conclusion'));

var builder = require('botbuilder');
var dateFns = require('date-fns');

var retryPrompts = require('../misc/speeches_utils/retry-prompts');
var texts        = require("../misc/speeches_utils/big-texts");

User        = require('../server/schema/models').user;
UserMission = require('../server/schema/models').user_mission;

const library = new builder.Library('game');

const MoreInformations = "Mais informações";
const Contact          = "Entrar em contato";
const Restart          = "Ir para o início";
const Yes              = "Sim";
const No               = "Não";

let email = "";
let user;
let user_mission;

var firstMissionCompleteMinDate = dateFns.format(new Date(2017, 08, 19), 'MM/DD/YYYY');
var today                       = dateFns.format(new Date(), 'MM/DD/YYYY');

library.dialog('/', [
    (session) => {
        session.sendTyping();
        session.beginDialog('validators:email', {
            prompt: "Qual é o e-mail que você utilizou para se cadastrar como líder?",
            retryPrompt: retryPrompts.email,
            maxRetries: 10
        });
    },
    (session, args) => {
        if (args.resumed) {
            session.sendTyping();
            session.send('Você tentou inserir um e-mail inválido muitas vezes. Tente novamente mais tarde.');
            session.endDialogWithResult({ resumed: builder.ResumeReason.notCompleted });
            return;
        }

        email = args.response;
        session.sendTyping();

        User.count({
            where: {
                email: email
            }
        })
        .then(count => {
            if (count != 0) {
                session.sendTyping();
                session.replaceDialog('/missionStatus');
                return email;
            } else {
                session.sendTyping();
                session.send("Hmmm...Não consegui encontrar seu cadastro. Tente novamente.");
                session.endDialog();
                session.beginDialog('/welcomeBack');
                return;
            }
        });
    },
]).cancelAction('cancelar', null, { matches: /^cancelar/i });

library.dialog('/missionStatus', [
    (session) => {
        /*
            Verifica se o usuário está ativo, aprovado e se possui alguma entrada na
            tabela 'user_mission'. Caso ele não tenha nenhuma entrada, está aprovado mas está
            inativo. Devo então iniciar o processo da primeira missão
        */
        if (session.message.address.channelId == 'facebook') {
            var fbId = session.message.sourceEvent.sender.id;

            User.findOne({
            where: {
                email: email,
                // fb_id: fbId
            }
            }).then(User => {
                user = User.dataValues;

                UserMission.count({
                    where: {
                        user_id: user.id
                    }
                })
                .then(count => {
                    if (count === 0 && !user.active && user.approved) {
                        session.beginDialog(
                            'firstMissionAssign:/',
                            {   
                               user:         user,
                               user_mission: user_mission
                            }); 
                        return user;
                    } else {
                        session.replaceDialog('/currentMission');
                    }
                });
            });
        } else {
            User.findOne({
                where: {
                    email: email,
                }
            }).then(User => {
                user = User.dataValues;

                UserMission.count({
                    where: {
                        user_id: user.id
                    }
                })
                .then(count => {
                    if (count === 0 && !user.active && user.approved) {
                        session.beginDialog(
                            'firstMissionAssign:/',
                            {   
                               user:         user,
                               user_mission: user_mission
                            }); 
                        return user;
                    } else {
                        session.replaceDialog('/currentMission');
                    }
                });
            });
        }
    }
]).cancelAction('cancelar', null, { matches: /^cancelar/i });

library.dialog('/currentMission', [
    (session) => {
        UserMission.findAll({
            where: {
                user_id: user.id,
            }
        })
        .then(UserMission => {
            user_mission = UserMission[UserMission.length-1].dataValues;

            switch(user_mission.mission_id) {
                case 1:
                    if (user_mission.completed) {
                        session.beginDialog(
                            'secondMissionAssign:/',
                            {
                                user:         user,
                                user_mission: user_mission
                            }
                        );
                    } else {
                        session.beginDialog(
                            'firstMissionConclusion:/',
                            {
                                user:         user,
                                user_mission: user_mission
                            }
                        );
                    }
                    break;
                case 2:
                    if (user_mission.completed) {
                        session.send("Parabéns! Você concluiu o processo de missões do Gastos Abertos!");
                        session.send("Caso você não participe ainda, junte-se a nós no grupo do WhatsApp do Gastos Abertos! Lá temos bastante discussões legais e ajudamos com tudo que conseguimos!");
                        session.send("Basta clicar no link a seguir: https://chat.whatsapp.com/Flm0oYPVLP0KfOKYlUidXS");
                        session.endDialog();
                        session.beginDialog('/welcomeBack');
                    } else if (user_mission.metadata.request_generated === 0) {
                        session.send("Você está na segunda missão, no entanto não gerou um pedido de acesso à informação.");
                        session.replaceDialog("/sendToInformationAccessRequest");
                    } else {
                        session.beginDialog(
                            'secondMissionConclusion:/',
                            {
                                user:         user,
                                user_mission: user_mission
                            }
                        ); 
                    }
            }
        });
    }
]).cancelAction('cancelar', null, { matches: /^cancelar/i });

library.dialog('/sendToInformationAccessRequest', [
    (session) => {
        builder.Prompts.choice(session,
            'Vamos gerar seu pedido?',
            [Yes, No],
            {
                listStyle: builder.ListStyle.button,
                retryPrompt: retryPrompts.choice
            }
        );
    },

    (session, args) => {
         switch(args.response.entity) {
            case Yes:
                session.beginDialog(
                    'informationAccessRequest:/',
                    {
                        user:         user,
                        user_mission: user_mission
                    }
                );
                break;
            case No:
                session.send("Okay! Eu estarei aqui esperando para começarmos!");
                session.endDialog();
                session.replaceDialog('/welcomeBack');
                break;
        }
    }
]);

module.exports = library;