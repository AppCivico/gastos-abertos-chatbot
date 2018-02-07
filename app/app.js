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

const User = require('./server/schema/models').user;

const GameSignUp = 'Inscrever-se';
const GastosAbertosInformation = 'Sobre o projeto';
const Missions = 'Processo de missões';
const InformationAcessRequest = 'Gerar pedido';
// const DialogFlowReconizer = require('./dialogflow_recognizer');
// const intents = new builder.IntentDialog({
// 	recognizers: [
// 		DialogFlowReconizer,
// 	],
// 	intentThreshold: 0.2,
// 	recognizeOrder: builder.RecognizeOrder.series,
// });
//
const custom = require('./custom_intents');
//
// bot.recognizer(intents);
//
// intents.matches('ajuda', 'gastosAbertosInformation:/');
// intents.matches('missoes', 'game:/');
// intents.matches('pedido', 'gastosAbertosInformation:/');
// intents.matches('Default Welcome Intent', '/getstarted');
// intents.matches('Default Fallback Intent', '/welcomeBack');

// bot.dialog('/', intents);
// console.log(`intents: ${Object.entries(intents.actions)}`);

// const { pageToken } = process.env;

bot.beginDialogAction('getStarted', '/getStarted');
bot.beginDialogAction('reset', '/reset'); // TODO check behavior on messenger

bot.dialog('/', [
	(session) => {
		session.userData = {}; // for testing purposes
		// TODO teste sem ID
		// session.userData.userid = session.message.sourceEvent.sender.id;
		// session.userData.pageid = session.message.sourceEvent.recipient.id;
		// session.userData.pageToken = pageToken;

		// hardcoded ids for testing purposes
		session.userData.userid = '100004770631443';
		session.userData.pageToken = 'EAAWZAUU5VsL4BAHhKpSZCWFHACyXuXGyihZCLuaFKZC7fvp43WxCafDXxAPW1Nhjh6LKyRnhMpEqnPbOS7Dn1VTLOll77hhmKMiXcXmvz3wEcaQtvgbTWq9KN96vBX9iAO1Er89UBZBIBwtFnKSACOdVTIRuAk7JljwEHCvNf5AZDZD';

		// default value: undefined. Yes, it's only a string.
		custom.userFacebook(
			session.userData.userid, session.userData.pageToken,
			(result => User.findOrCreate({
				where: { fb_id: session.userData.userid },
				defaults: {
					name: `${result.first_name} ${result.last_name}`,
					occupation: 'undefined',
					email: 'undefined',
					birth_date: 'undefined',
					state: 'undefined',
					city: 'undefined',
					cellphone_number: 'undefined',
					active: true,
					approved: true,
					fb_id: result.id,
				},
			})
				.spread((user, created) => {
					console.log(user.get({
						plain: true,
					}));
					console.log(`Was created? => ${created}`);
				})) // eslint-disable-line comma-dangle
		);

		session.replaceDialog('/getStarted');
	},
]);

bot.dialog('/getStarted', [
	(session) => {
		session.sendTyping();
		if (!session.userData.firstRun) { // first run
			session.userData.firstRun = true;
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
			session.replaceDialog('/promptButtons');
		} else { // welcome back
			User.findOne({
				attributes: ['name'],
				where: { fb_id: session.userData.userid },
			}).then((user) => {
				session.send(`Olá, ${user.get('name').substr(0, user.get('name').indexOf(' '))}! Bem vindo de volta! ${emoji.get('hugging_face').repeat(2)}`);
				session.replaceDialog('/promptButtons');
			}).catch(() => {
				session.send(`Olá, parceiro! Bem vindo de volta! ${emoji.get('hugging_face').repeat(2)}`);
				session.replaceDialog('/promptButtons');
			});
		}
	},
]);

bot.dialog('/promptButtons', [
	(session) => {
		builder.Prompts.choice(
			session,
			`Em que assunto eu posso te ajudar? ${emoji.get('slightly_smiling_face').repeat(2)}`,
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
				session.beginDialog('gastosAbertosInformation:/', {	User });
				break;
			case GameSignUp:
				session.beginDialog('gameSignUp:/');
				break;
			case Missions:
				session.beginDialog('game:/', { user: User });
				break;
			default: // InformationAcessRequest
				session.beginDialog('informationAccessRequest:/');
				break;
			}
		}
	},
	(session) => {
		session.replaceDialog('/getStarted');
	},
]);
// ]).customAction({
// 	matches: /^[\w]+/,
// 	onSelectAction: (session) => {
// 		custom.allIntents(session, intents, ((response) => {
// 			console.log(`session: ${(session)}`);
// 			if (response === 'error') {
// 				session.send('Não entendi');
// 			} else {
// 				session.replaceDialog(response);
// 			}
// 		}));
// 	},
// });
