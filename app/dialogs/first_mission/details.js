const library = new builder.Library('firstMissionDetails');

bot.library(require('./conclusion'));

var retryPrompts = require('../../misc/speeches_utils/retry-prompts');
var texts        = require("../../misc/speeches_utils/big-texts");

const Contact    = "Entrar em contato";
const Restart    = "Ir para o início";
const Conclusion = "Concluir a missão";

library.dialog('/', [
    (session) => {
        session.send(texts.first_mission.details);

        builder.Prompts.choice(session,
            'Posso te ajudar com mais alguma coisa?',
                [Contact, Restart, Conclusion],
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
                session.beginDialog('/welcomeBack');
                break;
            case Conclusion:
                session.endDialog();
                session.beginDialog('firstMissionConclusion:/')
        }
    }
]).cancelAction('cancelar', null, { matches: /^cancelar/i });

module.exports = library;