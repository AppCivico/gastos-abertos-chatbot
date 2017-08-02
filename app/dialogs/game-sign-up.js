var builder = require('botbuilder');

const library = new builder.Library('gameSignUp');

library.dialog('/', [
    (session) => {
        builder.Prompts.text(session, "Qual é o seu nome completo?");
    },
    (session, args) => {
        session.dialogData.fullName = args.response;
        // TODO implementar fluxo de validação de e-mail
        builder.Prompts.text(session, "Qual é o seu e-mail?");
    },
    (session, args) => {
        session.dialogData.email = args.response;
        builder.Prompts.time(session, "Qual é a sua data de nascimento? (dd/mm/aaaa)", {
            retryPrompt: 'Hummm. Não entendi a data que você digitou. Vamos tentar novamente?',
        });
    },
    (session, args) => {
        session.dialogData.birthDate = args.response.entity;
        // TODO implementar fluxo de validação de sigla de estado
        builder.Prompts.text(session, "Qual é o estado(sigla) que você mora?", {
            retryPrompt: 'Hummm. Não entendi a data que você digitou. Vamos tentar novamente?',
        });
    },
    (session, args) => {
        session.dialogData.state = args.response;
        builder.Prompts.text(session, "Qual é o município que você representará?");
    },
    (session, args) => {
        session.dialogData.city = args.response;
        // Todo implementar fluxo de validação de celular
        builder.Prompts.number(session, "Qual é o seu número de telefone celular? Não esqueça de colocar o DDD.");
    },
    (session, args) => {
        session.dialogData.cellphoneNumber = args.response;
        builder.Prompts.text(session, "Qual a sua ocupação?");
    },
    (session, args) => {
        session.dialogData.occupation = args.response;
        console.log(session.dialogData);

        session.send('Terminamos nossa primeira missão!' + +
            '\n\nAcho que formamos uma bom time' + + 
            '\n\nAgora vamos esperar a equipe do Gastos Abertos confirmar sua inscrição. Eles levam até 24h para enviar em seu email todas as informações.'+
            '\n\nNos encontramos na próxima missão!');
        session.endDialogWithResult({ resumed: builder.ResumeReason.completed });
    },
]).cancelAction('cancel', null, { matches: /^cancel/i });

module.exports = library;