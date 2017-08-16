require('dotenv').config();
require('./connectorSetup.js')();

bot.library(require('./validators'));
bot.library(require('./dialogs/game-sign-up'));
bot.library(require('./dialogs/contact'));
bot.library(require('./dialogs/gastos-abertos-information'));

const GameSignUpOption         = "Quero fazer minha inscrição para o 2º Ciclo";
const GastosAbertosInformation = "Quero saber mais sobre o  Gastos Abertos";
const Contact                  = "Entre em contato com o Gastos Abertos";

bot.beginDialogAction('getstarted', '/getstarted');

bot.dialog('/getstarted', [
    (session) => {
        console.log(session.userData);
        session.sendTyping();
        if( !session.userData.firstRun ) {
            // Store the returned user page-scoped id (USER_ID) and page id
            session.userData.userid = session.message.sourceEvent.sender.id;
            session.userData.pageid = session.message.sourceEvent.recipient.id;

            // DELAY ISN'T THE REQUEST - I THINK IT'S THE INITIAL REQUEST TO BOTFRAMEWORK

            // Move to the /getprofile dialog
            session.beginDialog('/promptButtons');
        } else {
            // The firstname has been stored so the user has completed the /getstarted dialog
            // Stop this dialog and Welcome them back
            session.replaceDialog('/promptButtons');
        }
    }
    /*(session) => {
        if (session.message.address.channelId == "facebook" && session.message.text == "GET_STARTED") {
            session.send({
                attachments: [
                    {
                        contentType: 'image/jpeg',
                        contentUrl: "https://gallery.mailchimp.com/cdabeff22c56cd4bd6072bf29/images/8e84d7d3-bba7-43be-acac-733dd6712f78.png"
                    }
                ]
            });
            session.replaceDialog('/promptButtons');
        }

        if (session.message.address.channelId == "emulator") {
            session.replaceDialog('/promptButtons');
        }
    }*/
]);

bot.dialog('/promptButtons', [
    (session) => {
        builder.Prompts.choice(session,
            'Olá, eu sou o Guaxi.  Sou o agente virtual do Gastos Abertos e seu parceiro em buscas e pesquisas. Como posso te ajudar?',
            [GastosAbertosInformation, GameSignUpOption, Contact],
            { listStyle: builder.ListStyle.button }
        );
    },
    (session, result) => {
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
