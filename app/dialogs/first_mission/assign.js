const library = new builder.Library('firstMissionAssign');

bot.library(require('../contact'));
bot.library(require('./conclusion'));
bot.library(require('./details'));

User        = require('../../server/schema/models').user;
UserMission = require('../../server/schema/models').user_mission;

const MoreInformations = "Mais detalhes";
const Conclusion       = "Conclusão da missão";
const Contact          = "Entrar em contato";
const Restart          = "Ir para o início";
const Yes              = "Sim";
const No               = "Não";

var retryPrompts = require('../../misc/speeches_utils/retry-prompts');
var texts        = require("../../misc/speeches_utils/big-texts");
var emoji        = require("../../misc/speeches_utils/emojis");

let user;
let user_mission;

library.dialog('/', [
    (session, args) => {
        user         = args.user;
        user_mission = args.user_mission;

        if (session.message.address.channelId == 'facebook') {
            User.update({
                fb_id: session.message.sourceEvent.sender.id
            }, {
                where: {
                    id: user.id
                },
                returning: true,
            })
            .then(result => {
                console.log("User updated sucessfuly");
            })
            .catch(e => {
                console.log(e);
                throw e;
            });
        }

        UserMission.create({
            user_id: user.id,
            mission_id: 1,
        })
        .then(UserMission => {
            session.send("Vamos lá! Que comece o processo de missões!");
            session.send(texts.first_mission.assign);

            builder.Prompts.choice(session,
                'Quer o link para alguns portais de transparência para usar como referência?',
                [Yes, No],
                {
                    listStyle: builder.ListStyle.button,
                    retryPrompt: retryPrompts.choice
                }
            );
        })
        .catch(e => {
            console.log("Error creating user mission" + e);
            session.send("Oooops, tive um problema ao iniciar suas missões, tente novamente mais tarde e entre em contato conosco.");
            session.endDialogWithResult({ resumed: builder.ResumeReason.notCompleted });
            throw e;
        });
    },
    (session, args) => {
        

        switch(args.response.entity) {
            case Yes:
                session.send(texts.first_mission.reference_transparency_portals);
                break;
            case No:
                session.send("Okay! Mas qualquer dúvida pode entrar em contato com a gente aqui do Gastos Abertos tá?");
                break;
        }

        builder.Prompts.choice(session,
            'Quer ver quais serão os pontos sobre os quais eu farei perguntas sobre o portal de transparência?',
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
                session.send(texts.first_mission.questions);
                break;
            case No:
                session.send("Beleza!");
                break;
        }

        builder.Prompts.choice(session,
            'Posso te ajudar com mais alguma coisa?',
            [MoreInformations, Conclusion, Contact, Restart],
            {
                listStyle: builder.ListStyle.button,
                retryPrompt: retryPrompts.choice
            }
        );
    },

    (session, args) => {
        switch(args.response.entity) {
            case MoreInformations:
                session.send(texts.first_mission.details);
                
                builder.Prompts.choice(session,
                    'Quer o link para alguns portais de transparência para usar como referência?',
                    [Yes, No],
                    {
                        listStyle: builder.ListStyle.button,
                        retryPrompt: retryPrompts.choice
                    }
                );
                break;
            case Contact:
                session.beginDialog('contact:/');
                break;
            case Restart:
                session.endDialog();
                session.beginDialog('/welcomeBack');
                break;
            case Conclusion:
                session.endDialog();
                session.beginDialog(
                    'firstMissionConclusion:/',
                    {
                        user:         user,
                        user_mission: user_mission
                    }
                );
                break;
        }
    },

    (session, args) => {
        switch(args.response.entity) {
            case Yes:
                session.send(texts.first_mission.reference_transparency_portals);
                break;
            case No:
                session.send("Okay! Mas qualquer dúvida pode entrar em contato com a gente aqui do Gastos Abertos tá?");
                break;
        }

        builder.Prompts.choice(session,
            'Quer ver quais serão os pontos sobre os quais eu farei perguntas sobre o portal de transparência?',
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
                session.send(texts.first_mission.questions);
                break;
            case No:
                session.send("Beleza!");
                break;
        }

        builder.Prompts.choice(session,
            'Posso te ajudar com mais alguma coisa?',
            [MoreInformations, Conclusion, Contact, Restart],
            {
                listStyle: builder.ListStyle.button,
                retryPrompt: retryPrompts.choice
            }
        );
    },

    (session, args) => {
        switch(args.response.entity) {
            case MoreInformations:
                session.send(texts.first_mission.details);
                
                builder.Prompts.choice(session,
                    'Quer o link para alguns portais de transparência para usar como referência?',
                    [Yes, No],
                    {
                        listStyle: builder.ListStyle.button,
                        retryPrompt: retryPrompts.choice
                    }
                );
                break;
            case Contact:
                session.beginDialog('contact:/');
                break;
            case Restart:
                session.endDialog();
                session.beginDialog('/welcomeBack');
                break;
            case Conclusion:
                session.endDialog();
                session.beginDialog(
                    'firstMissionConclusion:/',
                    {
                        user:         user,
                        user_mission: user_mission
                    }
                );
                break;
        }
    },
]).cancelAction('cancelar', null, { matches: /^cancelar/i });

module.exports = library;