const library = new builder.Library('firstMissionAssign');

bot.library(require('../contact'));
bot.library(require('./conclusion'));

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
        console.log(user.id);

        UserMission.create({
            user_id: user.id,
            mission_id: 1,
        })
        .then(UserMission => {
            session.send("Vamos lá! Que comece o processo de missões!");
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

        User.update({
            fb_id: session.message.sourceEvent.sender.id
        }, {
            where: {
                id: user.id
            },
            returning: true,
        })
        .then(result => {
            console.log(result);
        })
        .catch(e => {
            console.log(e);
            throw e;
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
]).cancelAction('cancelar', null, { matches: /^cancelar/i });

module.exports = library;