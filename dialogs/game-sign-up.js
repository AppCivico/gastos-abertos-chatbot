var builder = require('botbuilder');

const library = new builder.Library('gameSignUp');

library.dialog('/', [
    (session) => {
        builder.Prompts.text(session, "Qual é o seu nome completo?");
    },
    (session, args) => {
        session.dialogData.fullName = args.response;
        builder.Prompts.text(session, 'Qual é o seu e-mail?');
    },
    (session, args) => {
        session.dialogData.email = args.response;
        builder.Prompts.time(session, 'Qual é a sua data de nascimento? (dd/mm/aaaa)', {
            retryPrompt: 'Não entendi a data que você me mandou, tente novamente como no exemplo: 11/05/1998',
        });
    },
    (session, args) => {
        session.dialogData.birthDate = args.response.entity;
        builder.Prompts.text(session, 'Qual é o estado(sigla) que você mora?');
    },
    (session, args) => {
        session.dialogData.state = args.response;
        builder.Prompts.text(session, 'Qual é o município que você representará?');
    },
    (session, args) => {
        session.dialogData.city = args.response;
        builder.Prompts.number(session, 'Qual é o seu número de telefone celular? (DD)#####-####');
    },
    (session, args) => {
        session.dialogData.phoneNumber = args.response;
        session.send('Obrigado! Entraremos em contato em breve!');
        console.log(session.dialogData);
        session.endDialogWithResult({ resumed: builder.ResumeReason.completed });
    }
]).cancelAction('cancel', null, { matches: /^cancel/i });

module.exports = library;

