var builder = require('botbuilder');

var retryPrompts = require('../misc/speeches_utils/retry-prompts');

User = require('../server/schema/models').user;

const library = new builder.Library('game');

library.dialog('/', [
    (session) => {
        session.sendTyping();
        session.beginDialog('validators:email', {
            prompt: "Qual é o e-mail que você utilizou para se cadastrar como líder?",
            retryPrompt: retryPrompts.email,
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

        User.count({
            where: {
                email: session.dialogData.email
            }
        })
        .then(count => {
            if (count != 0) {
                session.sendTyping();
                session.send("Vamos à primeira missão!");
                session.replaceDialog('/firstMissionAssign');
            } else {
                session.sendTyping();
                session.send("Hmmm...Não consegui encontrar seu cadastro. Tente novamente.");
                session.endDialog();
                return;
            }
        });
    },
]).cancelAction('cancelar', null, { matches: /^cancelar/i });

library.dialog('/firstMissionAssign', [
    (session) => {
        session.send("A sua tarefa é:");
    }
]).cancelAction('cancelar', null, { matches: /^cancelar/i });

module.exports = library;