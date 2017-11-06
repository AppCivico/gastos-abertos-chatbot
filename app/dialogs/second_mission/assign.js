const library = new builder.Library('secondMissionAssign');

bot.library(require('../information-access-request'));

User        = require('../../server/schema/models').user;
UserMission = require('../../server/schema/models').user_mission;

const Yes      = "Sim";
const No       = "Não";
const HappyYes = "Vamos nessa!";

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
                session.replaceDialog('/assign')
                break;
            case No:
                session.send("Okay! Eu estarei aqui esperando para começarmos!");
                session.endDialog();
                session.beginDialog('/welcomeBack');
                break;
        }
    }
]).cancelAction('cancelar', null, { matches: /^cancelar/i });

library.dialog('/assign', [
    (session) => {
        UserMission.create({
                user_id: user.id,
                mission_id: 2,
                metadata: { informationAccessRequestGenerated: 0 }
            })
            .then(UserMission => {
                session.send("Vamos nessa!");
                session.send(texts.second_mission.assign);
                builder.Prompts.choice(session,
                'Vamos gerar nosso pedido de acesso à informação? Eu precisarei te fazer mais algumas perguntas referente ao portal de transparência.',
                    [ HappyYes, No ],
                    {
                        listStyle: builder.ListStyle.button,
                        retryPrompt: retryPrompts.choice
                    }
                );
        });
    },

    (session, args) => {
        switch(args.response.entity) {
            case HappyYes:
                UserMission.update({
                    metadata: { informationAccessRequestGenerated: 1 }
                }, {
                    where: {
                        user_id: user.id,
                        mission_id: 2,
                        completed: false
                    },
                    returning: true,
                })
                .then(result => {
                    console.log(result + "Mission updated sucessfuly");
                    session.beginDialog(
                    'informationAccessRequest:/',
                    {
                        user:         user,
                        user_mission: user_mission
                    }
                );
                })
                .catch(e => {
                    console.log("Error updating mission" + e);
                    throw e;
                });
                break;
            case No:
                session.send("Beleza! Estarei te esperando aqui para seguirmos em frente!");
                session.endDialog();
                session.beginDialog('/welcomeBack');
                break;
        }
    }
]);

module.exports = library;