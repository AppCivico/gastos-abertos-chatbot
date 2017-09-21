require('dotenv').config();
require('./connectorSetup.js')();

var dateFns      = require('date-fns');
var retryPrompts = require('./misc/speeches_utils/retry-prompts');

bot.library(require('./validators'));
bot.library(require('./dialogs/game-sign-up'));
bot.library(require('./dialogs/contact'));
bot.library(require('./dialogs/gastos-abertos-information'));
bot.library(require('./dialogs/game'));

const GameSignUpOption         = "Inscrição 2º Ciclo";
const GastosAbertosInformation = "Gastos Abertos";
const Contact                  = "Entrar em contato";
const Game                     = "Processo de missões";

var maxSignUpDate = dateFns.format(new Date(2017, 08, 28), 'MM/DD/YYYY');
var today         = dateFns.format(new Date(), 'MM/DD/YYYY');

bot.beginDialogAction('getstarted', '/getstarted');
bot.beginDialogAction('reset', '/reset');

bot.dialog('/', [
    (session) => {
        session.replaceDialog('/promptButtons');
    }
]).triggerAction({ matches: ['Inscrição 2º Ciclo', 'Informações', 'Entrar em contato'] });

bot.dialog('/getstarted', [
    (session) => {
        session.clearDialogStack();
        console.log(session.userData);
        session.sendTyping();
        if( !session.userData.firstRun ) {

            session.userData.userid = session.message.sourceEvent.sender.id;
            session.userData.pageid = session.message.sourceEvent.recipient.id;

            session.replaceDialog('/welcomeBack');
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
            'Em que assunto eu posso te ajudar?',
            [GastosAbertosInformation, Game, GameSignUpOption, Contact],
            {
                listStyle: builder.ListStyle.button,
                retryPrompt: retryPrompts.choice
            }
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
                    if (today > maxSignUpDate) {
                        session.send("Oooops...As inscrições para o segundo ciclo de missões do Gastos Abertos já se incerraram.");
                    } else {
                        session.beginDialog('gameSignUp:/');
                    };
                    break;
                case Contact:
                    session.beginDialog('contact:/');
                    break;
                case Game:
                    if (today <= maxSignUpDate) {
                        session.beginDialog('game:/');
                    } else {
                        session.send("Calma lá! O processo de missões começa só no dia 12/09/2017.\n\nNo dia 12/09 basta só me chamar de novo e selecionar esta opção novamente e iremos começar!");
                    }
                    break;
            }
        }
    }
]).cancelAction('cancelar', null, { matches: /^cancelar/i });

bot.dialog('/welcomeBack', [
    (session) => {
        session.sendTyping();
        session.send("Olá companheiro! Bem vindo de volta!");
        builder.Prompts.choice(session,
            'Em que assunto eu posso te ajudar?',
            [GastosAbertosInformation, Game, GameSignUpOption, Contact],
            {
                listStyle: builder.ListStyle.button,
                retryPrompt: retryPrompts.choice
            }
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
                    if (today > maxSignUpDate) {
                        session.send("Oooops...As inscrições para o segundo ciclo de missões do Gastos Abertos já se incerraram.");
                    } else {
                        session.beginDialog('gameSignUp:/');
                    };
                    break;
                case Contact:
                    session.beginDialog('contact:/');
                    break;
                case Game:
                    if (today <= maxSignUpDate) {
                        session.beginDialog('game:/');
                    } else {
                        session.send("Calma lá! O processo de missões começa só no dia 12/09/2017.\n\nNo dia 12/09 basta só me chamar de novo e selecionar esta opção novamente e iremos começar!");
                    }
                    break;
            }
        }
    }
])

bot.dialog('/reset', [
    (session, activity) => {
        session.endDialog();
        session.beginDialog('/');
    }
]);
