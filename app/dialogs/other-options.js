var builder = require('botbuilder');
var Trello  = require('trello');

var trello    = new Trello("85f21b05e0d18f125903ae69f5d0b0b0", "2d69092b57dc9e0c00a5ff920b9ff6eb03c0b05e22fa1c27c27d3d2f6870c8d4");
const library = new builder.Library('otherOptions');

const SignUpProblems = "Problemas na inscrição";
const Informations   = "Informações";
let   Subject        = "";

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
                        maxRetries: 10
                    });
                    Subject = SignUpProblems;
                    break;
                case Informations:
                    session.beginDialog('validators:email', {
                        prompt: "Deixe seu email, a equipe Gastos Abertos entrará em contato.",
                        retryPrompt: emoji_thinking.repeat(3) + "Hummm. Não entendi o e-mail que você digitou. Vamos tentar novamente?",
                        maxRetries: 10
                    });
                    Subject = Informations;
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
        } else {
            session.dialogData.email = args.response;
            if (Subject == SignUpProblems) {
                trello.addCard('e-mail: ' + session.dialogData.email, '', '598b168fc055dba624be6db1',
                            function (error, trelloCard) {
                                if (error) {
                                    console.log('Could not add card:', error);
                                }
                                else {
                                    console.log('Added card:', trelloCard);
                                }
                            }
                );
            }
            if (Subject == Informations) {
                trello.addCard('e-mail: ' + session.dialogData.email, '', '598b1964dccc66efd2ab9d8e',
                            function (error, trelloCard) {
                                if (error) {
                                    console.log('Could not add card:', error);
                                }
                                else {
                                    console.log('Added card:', trelloCard);
                                }
                            }
                );
            }
            session.endDialogWithResult({ resumed: builder.ResumeReason.completed });
        }
    },
    (session, args) => {
        
    }
]).cancelAction('cancel', null, { matches: /^cancel/i });

module.exports = library;