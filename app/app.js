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
