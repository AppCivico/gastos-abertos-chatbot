const library = new builder.Library('secondMissionAssign');

bot.library(require('../contact'));

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

let user;
let user_mission;

library.dialog('/', [
    (session, args) => {
        user         = args.user;
        user_mission = args.user_mission;
        
        builder.Prompts.choice(session,
            'Vamos ver agora nossa segunda missão?',
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
                session.replaceDialog('assign')
                break;
            case No:
                session.send("Okay! Eu estarei aqui esperando para começarmos!");
                session.endDialog();
                session.beginDialog('/welcomeBack');
                break;
        }
    }
]).cancelAction('cancelar', null, { matches: /^cancelar/i });

library.dialog('assign', [
    (session) => {
        UserMission.create({
                user_id: user.id,
                mission_id: 2,
            })
            .then(UserMission => {
                session.send("Vamos agora para a sua segunda missão!");
                session.send(texts.first_mission.assign);
                builder.Prompts.choice(session,
                'Posso te ajudar com mais alguma coisa?',
                    [MoreInformations, Conclusion, Contact, Restart],
                    {
                        listStyle: builder.ListStyle.button,
                        retryPrompt: retryPrompts.choice
                    }
                );
        });
    },

    (session, args) => {
        switch(args.response.entity) {
            case MoreInformations:

                break;
            case Contact:
                session.beginDialog('contact:/');
                break;
            case Restart:
                session.endDialog();
                session.beginDialog('/');
                break;
        }
    }
])

module.exports = library;