require('dotenv').config();
require('./connectorSetup.js')();

var dateFns      = require('date-fns');
var retryPrompts = require('./misc/speeches_utils/retry-prompts');

bot.library(require('./validators'));
bot.library(require('./dialogs/game-sign-up'));
bot.library(require('./dialogs/contact'));
bot.library(require('./dialogs/gastos-abertos-information'));
bot.library(require('./dialogs/game'));

const GameSignUp               = "Inscrição 2º Ciclo";
const GastosAbertosInformation = "Sobre o projeto";
const Contact                  = "Entrar em contato";
const Game                     = "Processo de missões";
const Missions                 = "Concluir missões";
const InformationAcessRequest  = "Gerar pedido";

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
            [GastosAbertosInformation, Game, InformationAcessRequest],
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
                case Game:
                    session.replaceDialog('/game');
                    break;
                case InformationAcessRequest:
                    session.beginDialog('informationAccessRequest:/');
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
            [GastosAbertosInformation, Game],
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
                case Game:
                    session.replaceDialog('/game');
                    break;
            }
        }
    }
]).cancelAction('cancelar', null, { matches: /^cancelar/i });

bot.dialog('/game', [
    (session) => {
        session.sendTyping();
        builder.Prompts.choice(session,
            'O que você deseja fazer?',
            [GameSignUp, Missions],
            {
                listStyle: builder.ListStyle.button,
                retryPrompt: retryPrompts.choice
            }
        );
    },

    (session, result) => {
        if (result.response) {
            switch (result.response.entity) {
                case GameSignUp:
                    session.beginDialog('gameSignUp:/');
                    break;
                case Missions:
                    session.beginDialog('game:/');
                    break;
            }
        }
    }
]).cancelAction('cancelar', null, { matches: /^cancelar/i });

bot.dialog('/reset', [
    (session, activity) => {
        session.endDialog();
        session.beginDialog('/');
    }
]);
