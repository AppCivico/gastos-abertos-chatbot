require('dotenv').config();
require('./connectorSetup.js')();

bot.library(require('./validators'));
bot.library(require('./dialogs/game-sign-up'));
bot.library(require('./dialogs/contact'));
bot.library(require('./dialogs/gastos-abertos-information'));

const GameSignUpOption         = "Inscrição 2º Ciclo";
const GastosAbertosInformation = "Gastos Abertos";
const Contact                  = "Entrar em contato";

bot.beginDialogAction('getstarted', '/getstarted');
bot.beginDialogAction('reset', '/reset');

bot.dialog('/getstarted', [
    (session) => {
        console.log(session.userData);
        session.sendTyping();
        if( !session.userData.firstRun ) {

            session.userData.userid = session.message.sourceEvent.sender.id;
            session.userData.pageid = session.message.sourceEvent.recipient.id;

            session.beginDialog('/promptButtons');
        } else {
            session.replaceDialog('/promptButtons');
        }
    }
]);

bot.dialog('/promptButtons', [
    (session) => {
        session.sendTyping();
        session.send({
                attachments: [
                    {
                        contentType: 'image/jpeg',
                        contentUrl: "https://gallery.mailchimp.com/cdabeff22c56cd4bd6072bf29/images/8e84d7d3-bba7-43be-acac-733dd6712f78.png"
                    }
                ]
        });
        session.send('Olá, eu sou o Guaxi.\n\nSou o agente virtual do Gastos Abertos e seu parceiro em buscas e pesquisas.');
        builder.Prompts.choice(session,
            'Quer saber mais sobre?',
            [GastosAbertosInformation, GameSignUpOption, Contact],
            { listStyle: builder.ListStyle.button }
        );
    },
    (session, result) => {
        session.sendTyping();
        if (result.response) {
            switch (result.response.entity) {
                case GastosAbertosInformation:
                    session.beginDialog('gastosAbertosInformation:/');
                    break;
                case GameSignUpOption:
                    session.beginDialog('gameSignUp:/');
                    break;
                case Contact:
                    session.beginDialog('contact:/');
                    break;
                default :
                    session.send('Desculpa, não entendi a opção que você selecionou.');
                    break;
            }
        }
    }
]);

bot.dialog('/reset', [
    (session, activity) => {
        activity.GetStateClient().BotState.DeleteStateForUser(activity.ChannelId, activity.From.Id);
        session.beginDialog('/promptButtons');
    }
]);
