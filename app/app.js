require('dotenv').config();
require('./connectorSetup.js')();

var dateFns = require('date-fns');

bot.library(require('./validators'));
bot.library(require('./dialogs/game-sign-up'));
bot.library(require('./dialogs/contact'));
bot.library(require('./dialogs/gastos-abertos-information'));
bot.library(require('./dialogs/game'));

const GameSignUpOption         = "Inscrição 2º Ciclo";
const GastosAbertosInformation = "Gastos Abertos";
const Contact                  = "Entrar em contato";
const Game                     = "Processo de missões";

var maxSignUpDate = dateFns.format(new Date(2017, 08, 12), 'MM/DD/YYYY');
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
            'Em que assunto eu posso te ajudar?',
            [GastosAbertosInformation, Game, GameSignUpOption, Contact],
            {
                listStyle: builder.ListStyle.button,
                retryPrompt: "Desculpa, não entendi a opção que você selecionou.\n\nSelecione uma das opções abaixo"
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
                        session.send("Calma lá! O processo de missões começa só no dia 12/09/2017");
                    }
                    break;
            }
        }
    }
]).cancelAction('cancelar', null, { matches: /^cancelar/i });

bot.dialog('/reset', [
    (session, activity) => {
        activity.GetStateClient().BotState.DeleteStateForUser(activity.ChannelId, activity.From.Id);
        session.beginDialog('/promptButtons');
    }
]);
