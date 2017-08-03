var builder = require('botbuilder');

User = require('../server/models').user;

const library = new builder.Library('gameSignUp');

var emoji_thinking = "\uD83E\uDD14";
var emoji_clap     = "\uD83D\uDC4F";
var emoji_smile    = "\uD83E\uDD17";
var emoji_sunglass = "\uD83D\uDE0E";

library.dialog('/', [
    (session) => {
        builder.Prompts.text(session, "Qual é o seu nome completo?");
    },
    (session, args) => {
        session.dialogData.fullName = args.response;
        session.beginDialog('validators:email', {
            prompt: "Qual é o seu e-mail?",
            retryPrompt: emoji_thinking.repeat(3) + "Hummm. Não entendi o e-mail que você digitou. Vamos tentar novamente?",
        });
    },
    (session, args) => {
        session.dialogData.email = args.response;
        builder.Prompts.time(session, "Qual é a sua data de nascimento? (dd/mm/aaaa)", {
            retryPrompt: 'Hummm. Não entendi a data que você digitou. Vamos tentar novamente?',
        });
    },
    (session, args) => {
        session.dialogData.birthDate = args.response.entity;
        session.beginDialog('validators:state', {
            prompt: "Qual é o estado(sigla) que você mora?",
            retryPrompt: emoji_thinking.repeat(3) + "Hummm. Não entendi o estado que você digitou. Vamos tentar novamente?",
        });
    },
    (session, args) => {
        session.dialogData.state = args.response;
        builder.Prompts.text(session, "Qual é o município que você representará?");
    },
    (session, args) => {
        session.dialogData.city = args.response;
        session.beginDialog('validators:cellphone', {
            prompt: "Qual é o seu número de telefone celular? Não esqueça de colocar o DDD.",
            retryPrompt: emoji_thinking.repeat(3) + "Hummm. Não entendi o telefone que você digitou. Vamos tentar novamente?",
        });
    },
    (session, args) => {
        session.dialogData.cellphoneNumber = args.response;
        builder.Prompts.text(session, "Qual a sua ocupação?");
    },
    (session, args) => {
        session.dialogData.occupation = args.response;
        var tx = User.create({
            name: session.dialogData.fullName,
            email: session.dialogData.email,
            birth_date: session.dialogData.birthDate,
            state: session.dialogData.state,
            city: session.dialogData.city,
            cellphone_number: session.dialogData.cellphoneNumber,
            occupation: session.dialogData.occupation
        });

        console.log(tx);

        session.send('Terminamos nossa primeira missão!' + emoji_clap.repeat(3) +
            '\n\nAcho que formamos uma bom time' + emoji_smile + 
            '\n\nAgora vamos esperar a equipe do Gastos Abertos confirmar sua inscrição. Eles levam até 24h para enviar em seu email todas as informações.\n\nNos encontramos na próxima missão!'+
            emoji_sunglass
        );
        session.endDialogWithResult({ resumed: builder.ResumeReason.completed });
    },
]).cancelAction('cancel', null, { matches: /^cancel/i });

module.exports = library;