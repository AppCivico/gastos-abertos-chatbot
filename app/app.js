/* global  bot:true builder:true */
/* eslint no-param-reassign: ["error", { "props": true, "ignorePropertyModificationsFor":
["session"] }] */

require('dotenv').config();
require('./connectorSetup.js')();

const retryPrompts = require('./misc/speeches_utils/retry-prompts');
const emoji = require('node-emoji');

bot.library(require('./validators'));
bot.library(require('./dialogs/game-sign-up'));
bot.library(require('./dialogs/contact'));
bot.library(require('./dialogs/gastos-abertos-information'));
bot.library(require('./dialogs/game'));

const DialogFlowReconizer = require('./dialogflow_recognizer');

const GameSignUp = 'Inscrever-se';
const GastosAbertosInformation = 'Sobre o projeto';
const Contact = 'Entrar em contato';
const Informacoes = 'Informações';
const Missions = 'Processo de missões';
const InformationAcessRequest = 'Gerar pedido';

const intents = new builder.IntentDialog({
	recognizers: [
		DialogFlowReconizer,
	],
	intentThreshold: 0.2,
	recognizeOrder: builder.RecognizeOrder.series,
});

const custom = require('./custom_intents');

bot.recognizer(intents);

intents.matches('ajuda', 'gastosAbertosInformation:/');
intents.matches('missoes', 'game:/');
intents.matches('pedido', 'gastosAbertosInformation:/');
intents.matches('Default Welcome Intent', '/getstarted');
intents.matches('Default Fallback Intent', '/welcomeBack');

// bot.dialog('/', intents);
// console.log(`intents: ${Object.entries(intents.actions)}`);

bot.dialog('/', [
	(session) => {
		session.replaceDialog('/promptButtons');
	},
]).triggerAction({ matches: ['Inscrição 2º Ciclo', 'Informações', 'Entrar em contato'] });

bot.beginDialogAction('getstarted', '/getstarted');
bot.beginDialogAction('reset', '/reset');

bot.dialog('/greetings', [
	(session) => {
		session.replaceDialog('/promptButtons');
	},
]).triggerAction({ matches: [GameSignUp, Informacoes, Contact] });

bot.dialog('/getstarted', [
	(session) => {
		session.sendTyping();
		if (!session.userData.firstRun) {
			session.userData.userid = session.message.sourceEvent.sender.id;
			session.userData.pageid = session.message.sourceEvent.recipient.id;

			session.replaceDialog('/welcomeBack');
		} else {
			session.replaceDialog('/promptButtons');
		}
	},
]);

bot.dialog('/promptButtons', [
	(session) => {
		session.sendTyping();
		session.send({
			attachments: [
				{
					contentType: 'image/jpeg',
					contentUrl: 'https://gallery.mailchimp.com/cdabeff22c56cd4bd6072bf29/images/8e84d7d3-bba7-43be-acac-733dd6712f78.png',
				},
			],
		});
		session.send('Olá, eu sou o Guaxi, o agente virtual do Gastos Abertos e seu parceiro em buscas e pesquisas.');
		session.send(`\n\nVocê pode utilizar o menu abaixo para interagir comigo. ${emoji.get('hugging_face').repeat(2)}` +
		`\n\nPara retornar á este menu durante algum processo, basta digitar 'cancelar'. ${emoji.get('slightly_smiling_face').repeat(2)}`);
		builder.Prompts.choice(
			session,
			`Em que assunto eu posso te ajudar? ${emoji.get('hugging_face').repeat(2)}`,
			[GastosAbertosInformation, GameSignUp, Missions, InformationAcessRequest],
			{
				listStyle: builder.ListStyle.button,
				retryPrompt: retryPrompts.choiceIntent,
				promptAfterAction: false,
			} // eslint-disable-line comma-dangle
		);
	},

	(session, result) => {
		session.sendTyping();
		if (result.response) {
			switch (result.response.entity) {
			case GastosAbertosInformation:
				session.beginDialog('gastosAbertosInformation:/');
				break;
			case GameSignUp:
				session.beginDialog('gameSignUp:/');
				break;
			case Missions:
				session.beginDialog('game:/');
				break;
			case InformationAcessRequest:
				session.beginDialog('informationAccessRequest:/');
				break;
			default:
				session.replaceDialog('/welcomeBack');
			}
		}
	},
	(session) => {
		session.replaceDialog('/welcomeBack');
	},
]);
// ]).customAction({
// 	matches: /^[\w]+/,
// 	onSelectAction: (session) => {
// 		custom.allIntents(session, intents, ((response) => {
// 			console.log(`session: ${(session)}`);
// 			console.log('entrei aqui');
// 			if (response === 'error') {
// 				session.send('Não entendi');
// 			} else {
// 				session.replaceDialog(response);
// 			}
// 		}));
// 	},
// });
// ]).beginDialogAction('ajuda', 'gastosAbertosInformation:/', {
// 	matches: 'ajuda',
// }).beginDialogAction('pedido', 'informationAccessRequest:/', {
// 	matches: 'pedido',
// }).beginDialogAction('missoes', 'game:/', {
// 	matches: 'missoes',
// });

bot.dialog('/welcomeBack', [
	(session) => {
		session.sendTyping();
		session.send(`Olá, parceiro! Bem vindo de volta! ${emoji.get('hugging_face').repeat(2)}`);
		builder.Prompts.choice(
			session,
			'Em que assunto eu posso te ajudar?',
			[GastosAbertosInformation, GameSignUp, Missions, InformationAcessRequest],
			{
				listStyle: builder.ListStyle.button,
				retryPrompt: retryPrompts.choice,
			} // eslint-disable-line comma-dangle
		);
	},
	(session, result) => {
		session.sendTyping();
		if (result.response) {
			switch (result.response.entity) {
			case GastosAbertosInformation:
				session.beginDialog('gastosAbertosInformation:/');
				break;
			case GameSignUp:
				session.beginDialog('gameSignUp:/');
				break;
			case Missions:
				session.beginDialog('game:/');
				break;
			case InformationAcessRequest:
				session.beginDialog('informationAccessRequest:/');
				break;
			default:
				session.replaceDialog('/welcomeBack');
			}
		}
	},
	(session) => {
		session.replaceDialog('/welcomeBack');
	},
]);

bot.dialog('/reset', [
	(session) => {
		session.endDialog();
		session.beginDialog('/');
	},
]);
