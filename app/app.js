/* global  bot:true builder:true */
/* eslint no-param-reassign: ["error", { "props": true, "ignorePropertyModificationsFor":
["session"] }] */

require('dotenv').config();
require('./connectorSetup.js')();

const retryPrompts = require('./misc/speeches_utils/retry-prompts');
const emoji = require('node-emoji');

bot.library(require('./dialogs/send-message'));
bot.library(require('./dialogs/gastos-abertos-information'));
bot.library(require('./dialogs/game'));
bot.library(require('./validators'));


const User = require('./server/schema/models').user;

const GastosAbertosInformation = 'Quero aprender mais';
const Missions = 'Minha cidade?';
const InformationAcessRequest = 'Gerar um pedido';
const permissionQuestion = 'Ah, tudo bem eu te enviar de tempos em tempos informações ou notícias sobre dados abertos e transparência orçamentária?';
const sendMessage = 'Painel Administrativo';
const Yes = 'Sim!';
const No = 'Não';

let menuMessage;
let menuOptions = [GastosAbertosInformation, Missions, InformationAcessRequest];
// const DialogFlowReconizer = require('./dialogflow_recognizer');
// const intents = new builder.IntentDialog({
// 	recognizers: [
// 		DialogFlowReconizer,
// 	],
// 	intentThreshold: 0.2,
// 	recognizeOrder: builder.RecognizeOrder.series,
// });
//
const custom = require('./misc/custom_intents');
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

const { pageToken } = process.env;

bot.beginDialogAction('getStarted', '/getStarted');
bot.beginDialogAction('reset', '/reset');

bot.dialog('/', [
	(session) => {
		menuOptions = [GastosAbertosInformation, Missions, InformationAcessRequest];
		// TODO teste sem ID
		session.userData = {}; // for testing purposes
		session.userData.userid = session.message.sourceEvent.sender.id;
		// session.userData.pageid = session.message.sourceEvent.recipient.id;
		// session.userData.pageToken = pageToken;

		// hardcoded ids for testing purposes
		// session.userData.userid = '100004770631443';
		session.userData.pageToken = pageToken;

		// default value: 'undefined'. Yes, it's only a string.
		custom.userFacebook(
			session.userData.userid, session.userData.pageToken,
			(result => User.findOrCreate({
				where: { fb_id: session.userData.userid },
				defaults: {
					name: 'undefined',
					occupation: 'undefined',
					email: 'undefined',
					birth_date: 'undefined',
					state: 'undefined',
					city: 'undefined',
					cellphone_number: 'undefined',
					active: true,
					approved: true,
					fb_id: result.id,
					fb_name: `${result.first_name} ${result.last_name}`,
					session: session.dialogStack()[session.dialogStack().length - 1].id,
				},
			})
				.spread((user, created) => {
					console.log(user.get({
						plain: true,
					}));
					if (user.get('admin') === true) { // shows hidden admin menu
						menuOptions.push(sendMessage);
					}
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
			menuMessage = 'Vamos lá, como posso te ajudar?';
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
			session.send('Olá, eu sou o Guaxi, o assistente virtual do Gastos Abertos e seu parceiro sobre dados abertos e transparência em orçamento público.');
			session.send(`\n\nPara facilitar, há um menu com algumas opções sobre como podemos seguir essa parceria. ${emoji.get('smile')}`);
			session.send('Para retornar ao começo dessa conversa, a qualquer momento, basta digitar \'começar\'.');

			// TODO remover todas as menções de missão para o usuário.('Minha cidade?' deve ser trocado?)
			session.replaceDialog('/askPermission');
		} else { // welcome back
			menuMessage = 'Como posso te ajudar?';
			User.findOne({
				attributes: ['fb_name'],
				where: { fb_id: session.userData.userid },
			}).then((user) => {
				session.send(`Olá, ${user.get('fb_name').substr(0, user.get('fb_name').indexOf(' '))}! Bem vindo de volta! ${emoji.get('hugging_face').repeat(2)}`);
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
		custom.updateSession(session.userData.userid, session);
		builder.Prompts.choice(
			session, menuMessage, menuOptions,
			{
				listStyle: builder.ListStyle.button,
				retryPrompt: retryPrompts.choiceIntent,
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
			case Missions:
				session.beginDialog('game:/', { user: User });
				break;
			case sendMessage:
				session.beginDialog('sendMessage:/');
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

bot.dialog('/askPermission', [
	(session) => {
		custom.updateSession(session.userData.userid, session);
		builder.Prompts.choice(
			session, permissionQuestion,
			[Yes, No],
			{
				listStyle: builder.ListStyle.button,
				retryPrompt: retryPrompts.choiceIntent,
			} // eslint-disable-line comma-dangle
		);
	},

	(session, result) => {
		session.sendTyping();
		if (result.response) {
			switch (result.response.entity) {
			case Yes:
				session.send('Ótimo! Espero que você nos ajude na divulgação de conteúdo e informações sobre ' +
				'dados abertos e transparência orçamentária na sua cidade ou em seu círculo de amizades!');
				User.update({
					address: session.message.address,
				}, {
					where: {
						fb_id: session.userData.userid,
					},
					returning: true,
				})
					.then(() => {
						console.log('User address updated sucessfuly');
					})
					.catch((err) => {
						console.log(err);
						throw err;
					});
				break;
			default: // No
				session.send(`Tranquilo! Você poderá se inscrever no menu de informações. ${emoji.get('smile')}`);
				User.update({
					address: null,
				}, {
					where: {
						fb_id: session.userData.userid,
					},
					returning: true,
				})
					.then(() => {
						console.log('User address erased sucessfuly');
					})
					.catch((err) => {
						console.log(err);
						throw err;
					});
				break;
			}
			session.replaceDialog('/promptButtons');
		}
	},
]);
