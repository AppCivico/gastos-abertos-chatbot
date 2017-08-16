var builder = require('botbuilder');
var Trello  = require('trello');

var trello    = new Trello(process.env.TRELLO_API_KEY, process.env.TRELLO_USER_TOKEN);
const library = new builder.Library('contact');

const SignUpProblems = "Inscrição";
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

            builder.Prompts.text(session, "Qual é a sua mensagem para nós?");
        }
    },
    (session, args) => {
        session.dialogData.message = args.response;

        if (Subject == SignUpProblems) {
                trello.addCard('e-mail: ' + session.dialogData.email, session.dialogData.message, process.env.TRELLO_LIST_ID_1,
                    function (error, trelloCard) {
                        if (error) {
                            console.log('Could not add card:', error);
                            session.send("Oooops...Houve um problema ao enviar sua mensagem de contato, tente novamente.");
                            session.endDialogWithResult({ resumed: builder.ResumeReason.notCompleted });
                        }
                        else {
                            console.log('Added card:');
                            session.send("Recebemos seu contato com sucesso! Em breve você receberá em seu e-mail uma resposta!");
                            session.endDialogWithResult({ resumed: builder.ResumeReason.completed });
                        }
                    }
                );
            }
            if (Subject == Informations) {
                trello.addCard('e-mail: ' + session.dialogData.email, session.dialogData.message, process.env.TRELLO_LIST_ID_2,
                    function (error, trelloCard) {
                        if (error) {
                            console.log('Could not add card:', error);
                            session.send("Oooops...Houve um problema ao enviar sua mensagem de contato, tente novamente.");
                            session.endDialogWithResult({ resumed: builder.ResumeReason.notCompleted });
                        }
                        else {
                            console.log('Added card:');
                            session.send("Recebemos seu contato com sucesso! Em breve você receberá em seu e-mail uma resposta!");
                            session.endDialogWithResult({ resumed: builder.ResumeReason.completed });
                        }
                    }
                );
            }
            
    }
]).cancelAction('cancel', null, { matches: /^cancel/i });

module.exports = library;