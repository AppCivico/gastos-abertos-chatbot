bot.library(require('./contact'));
bot.library(require('./first_mission/conclusion'));
bot.library(require('./first_mission/assign'));
bot.library(require('./second_mission/assign'));

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
        User.findOne({
            where: {
                email: email
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

                    // if (today < firstMissionCompleteMinDate) {
                        // session.send("Vi aqui que você está na primeira missão.\n\nVocê poderá conclui-la a partir do dia 19/09/2017");
                        // session.endDialog();
                    // } else {
                    if (user_mission.completed) {
                        // session.beginDialog(
                        //     'secondMissionAssign:/',
                        //     {
                        //         user:         user,
                        //         user_mission: user_mission
                        //     }
                        // );
                        session.send("Você já concluiu a primeira missão, no entanto a segunda ainda não foi liberada.");
                        session.send("Pode ficar tranquilo que eu vou te mandar uma mensagem quando ela for liberada.");
                        session.endDialog();
                        session.beginDialog('/welcomeBack');
                    } else {
                        session.beginDialog(
                            'firstMissionConclusion:/',
                            {
                                user:         user,
                                user_mission: user_mission
                            }
                        );
                    }
                    // }
                    break;
                case 2:
                    if (user_mission.completed) {
                        session.send("Calma lá! Você já concluiu a missão 2, mas ainda não foi liberada a missão 3.");
                    } else {
                        session.send("Calma lá amigo! A conclusão da missão 2 ainda não foi liberada.");
                    }
            }
        });
    }
]).cancelAction('cancelar', null, { matches: /^cancelar/i });

module.exports = library;