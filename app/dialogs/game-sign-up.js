var builder = require('botbuilder');
var dateFns = require('date-fns');

User = require('../server/schema/models').user;

const library = new builder.Library('gameSignUp');

const emoji_thinking = "\uD83E\uDD14";
const emoji_clap     = "\uD83D\uDC4F";
const emoji_smile    = "\uD83E\uDD17";
const emoji_sunglass = "\uD83D\uDE0E";

library.dialog('/', [
    (session) => {
        session.sendTyping();
        builder.Prompts.text(session, "Qual é o seu nome completo?");
    },
    (session, args) => {
        session.dialogData.fullName = args.response;
        session.sendTyping();
        session.beginDialog('validators:email', {
            prompt: "Qual é o seu e-mail?",
            retryPrompt: emoji_thinking.repeat(3) + "Hummm. Não entendi o e-mail que você digitou. Vamos tentar novamente?",
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

        session.dialogData.email = args.response;
        session.sendTyping();
        builder.Prompts.time(session, "Qual é a sua data de nascimento? (dd/mm/aaaa)", {
            retryPrompt: 'Hummm. Não entendi a data que você digitou. Vamos tentar novamente?',
            maxRetries: 10
        });
    },
    (session, args) => {
        if (args.resumed) {
            session.sendTyping();
            session.send('Você tentou inserir uma data inválida muitas vezes. Tente novamente mais tarde.');
            session.endDialogWithResult({ resumed: builder.ResumeReason.notCompleted });
            return;
        }

        session.dialogData.birthDate = args.response.entity;
        session.sendTyping();
        session.beginDialog('validators:state', {
            prompt: "Qual é o estado(sigla) que você mora?",
            retryPrompt: emoji_thinking.repeat(3) + "Hummm. Não entendi o estado que você digitou. Vamos tentar novamente?",
            maxRetries: 10
        });
    },
    (session, args) => {
        if (args.resumed) {
            session.sendTyping();
            session.send('Você tentou inserir um estado inválido muitas vezes. Tente novamente mais tarde.');
            session.endDialogWithResult({ resumed: builder.ResumeReason.notCompleted });
            return;
        }

        session.dialogData.state = args.response;
        session.sendTyping();
        builder.Prompts.text(session, "Qual é o município que você representará?");
    },
    (session, args) => {
        session.dialogData.city = args.response;
        session.sendTyping();
        session.send("Ufa! Não desanime, parceiro. Faltam apenas 2 perguntas para finalizar sua inscrição. Vamos lá!");
        session.beginDialog('validators:cellphone', {
            prompt: "Qual é o seu número de telefone celular? Não esqueça de colocar o DDD.",
            retryPrompt: emoji_thinking.repeat(3) + "Hummm. Não entendi o telefone que você digitou. Vamos tentar novamente?",
            maxRetries: 10
        });
    },
    (session, args) => {
        if (args.resumed) {
            session.sendTyping();
            session.send('Você tentou inserir um número de telefone celular inválido muitas vezes. Tente novamente mais tarde.');
            session.endDialogWithResult({ resumed: builder.ResumeReason.notCompleted });
            return;
        }

        session.dialogData.cellphoneNumber = args.response;
        session.sendTyping();
        builder.Prompts.text(session, "Qual a sua ocupação?");
    },
    (session, args) => {
        session.dialogData.occupation = args.response;
        User.create({
            name: session.dialogData.fullName,
            email: session.dialogData.email,
            birth_date: session.dialogData.birthDate,
            state: session.dialogData.state,
            city: session.dialogData.city,
            cellphone_number: session.dialogData.cellphoneNumber,
            occupation: session.dialogData.occupation
        })
        .then(function(User) {
            console.log('User created sucessfully');
            session.send("Muito bom, parceiro! Finalizamos sua inscrição.");
            session.send("Nossa equipe vai enviar em seu email a confirmação deste cadastro.");
            session.send("Enquanto isso, nossa próxima tarefa é convidar mais pessoas para o 2º Ciclo Gastos Abertos.\n\n \
            Segue link para compartilhamento: https://www.facebook.com/messages/t/gastosabertos.\n\n \
            Até a próxima missão!");
            session.endDialogWithResult({ resumed: builder.ResumeReason.completed });
            return User;
        })
        .catch(e => {
            console.log("Error creating user");
            session.send('Oooops...Tive um problema ao criar seu cadastro. Tente novamente mais tarde.');
            session.endDialogWithResult({ resumed: builder.ResumeReason.notCompleted });
            throw e;
        });
    },
]).cancelAction('cancelar', null, { matches: /^cancelar/i });

module.exports = library;