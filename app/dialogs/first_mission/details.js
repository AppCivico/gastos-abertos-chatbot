const library = new builder.Library('firstMissionDetails');

var retryPrompts = require('../../misc/speeches_utils/retry-prompts');
var texts        = require("../../misc/speeches_utils/big-texts");

const Contact    = "Entrar em contato";
const Restart    = "Ir para o início";

library.dialog('/', [
    (session) => {
        session.send(texts.first_mission.details);

        builder.Prompts.choice(session,
            'Posso te ajudar com mais alguma coisa?',
                [Contact, Restart],
                {
                    listStyle: builder.ListStyle.button,
                    retryPrompt: retryPrompts.choice
                }
        );
    },

    (session, args) => {
        switch(args.response.entity) {
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