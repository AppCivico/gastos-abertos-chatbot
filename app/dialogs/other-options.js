var builder = require('botbuilder');

const library = new builder.Library('otherOptions');

library.dialog('/', [
    (session) => {
        builder.Prompts.text("Qual é o seu nome completo?");
    },
    (session, args) => {
        session.dialogData.fullName = args.response;
        session.send('The phone you provided is: ' + args.response);

        builder.Prompts.time(session, 'Please enter your date of birth (MM/dd/yyyy):', {
            retryPrompt: 'The value you entered is not a valid date. Please try again:',
            maxRetries: 2
        });
    },
    (session, args) => {
        if (args.resumed) {
            session.send('You have tried to enter your date of birth many times. Please try again later.');
            session.endDialogWithResult({ resumed: builder.ResumeReason.notCompleted });
            return;
        }

        session.send('The date of birth you provided is: ' + args.response.entity);

        var newPassword = uuid.v1();
        session.send('Thanks! Your new password is _' + newPassword + '_');

        session.endDialogWithResult({ resumed: builder.ResumeReason.completed });
    }
]).cancelAction('cancel', null, { matches: /^cancel/i });

module.exports = library;