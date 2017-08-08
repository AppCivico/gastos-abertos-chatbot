var builder = require('botbuilder');

const library = new builder.Library('otherOptions');

const SignUpProblems = "Problemas na inscrição";
const Informations   = "Informações";

var emoji_thinking = "\uD83E\uDD14";

library.dialog('/', [
    (session) => {
        builder.Prompts.choice(session,
            "Obrigado por seu interesse. Mas, diga como posso te ajudar?",
            [SignUpProblems, Informations],
            { listStyle: builder.ListStyle.button }
        );
    },
    (session, result) => {
        if (result.response) {
            switch (result.response.entity) {
                case SignUpProblems:
                    session.beginDialog('validators:email', {
                        prompt: "Deixe seu email, a equipe Gastos Abertos entrará em contato.",
                        retryPrompt: emoji_thinking.repeat(3) + "Hummm. Não entendi o e-mail que você digitou. Vamos tentar novamente?",
                        maxRetries: 3
                    });
                    break;
                case Informations:
                    session.beginDialog('validators:email', {
                        prompt: "Deixe seu email, a equipe Gastos Abertos entrará em contato.",
                        retryPrompt: emoji_thinking.repeat(3) + "Hummm. Não entendi o e-mail que você digitou. Vamos tentar novamente?",
                        maxRetries: 3
                    });
                    break;
            }
        } else {
            session.send('Desculpa, não entendi a opção que você selecionou.');
        }
    },
    (session, args) => {
        if (args.resumed) {
            session.send('Você tentou inserir um e-mail inválido muitas vezes. Tente novamente mais tarde.');
            session.endDialogWithResult({ resumed: builder.ResumeReason.notCompleted });
            return;
        }
    },
    (session, args) => {
        session.endDialogWithResult({ resumed: builder.ResumeReason.completed });
    }
]).cancelAction('cancel', null, { matches: /^cancel/i });

module.exports = library;