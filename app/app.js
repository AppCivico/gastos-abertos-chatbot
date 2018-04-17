/* global bot:true builder:true chatBase:true */
/* eslint no-param-reassign: ["error", { "props": true,
"ignorePropertyModificationsFor": ["session"] }] */

require('dotenv').config();
require('./connectorSetup.js')();

const { pageToken } = process.env;
// const adminArray = process.env.adminArray.split(',');

global.chatBase = require('./misc/chatbase'); // setup happens down below
const retryPrompts = require('./misc/speeches_utils/retry-prompts');
const emoji = require('node-emoji');
const Timer = require('./timer');
// const csv = require('fast-csv');
// const fs = require('fs');

console.log(`Crontab MissionTimer is running? => ${Timer.MissionTimer.running}`);
console.log(`Crontab RequestTimer is running? => ${Timer.RequestTimer.running}`);

bot.library(require('./dialogs/gastos-abertos-information'));
bot.library(require('./dialogs/game'));
bot.library(require('./dialogs/contact'));
bot.library(require('./validators'));
bot.library(require('./panel/admin-panel'));
bot.library(require('./send-message-menu2'));
bot.library(require('./misc/error_message'));

const saveSession = require('./misc/save_session');
const errorLog = require('./misc/send_log');

const User = require('./server/schema/models').user;

const GastosAbertosInformation = 'Quero aprender mais';
const Missions = 'Minha cidade?';
const InformationAcessRequest = 'Gerar um pedido';
const permissionQuestion = 'Ah, tudo bem eu te enviar de tempos em tempos informações ou notícias sobre dados abertos e transparência orçamentária?';
const adminPanel = 'Painel Administrativo';
const Yes = 'Sim!';
const No = 'Não';
const messageMenu = 'Mandar mensagens';

let menuMessage = 'Como posso te ajudar?';
let menuOptions = [GastosAbertosInformation, Missions, InformationAcessRequest];

const DialogFlowReconizer = require('./dialogflow_recognizer');

const intents = new builder.IntentDialog({
	recognizers: [
		DialogFlowReconizer,
	],
	intentThreshold: 0.2,
	recognizeOrder: builder.RecognizeOrder.series,
});

const custom = require('./misc/custom_intents');

bot.recognizer(intents);

intents.matches('ajuda', 'gastosAbertosInformation:/');
intents.matches('missoes', 'game:/');
intents.matches('pedido', 'gastosAbertosInformation:/');
intents.matches('Default Welcome Intent', '/reset');
intents.matches('Default Fallback Intent', '/');

// bot.dialog('/', intents);
// console.log(`intents: ${Object.entries(intents.actions)}`);

bot.beginDialogAction('getStarted', '/getStarted');
bot.beginDialogAction('reset', '/reset');

bot.dialog('/reset', [
	(session) => {
		session.endDialog();
		session.beginDialog('*:/');
	},
]);

bot.dialog('/', [
	(session) => {
		session.userData = {};
		if (session.message.address.channelId === 'facebook') {
			session.userData.userid = session.message.sourceEvent.sender.id;
			session.userData.pageid = session.message.sourceEvent.recipient.id;
		} else {
			// hardcoded ids for testing purposes
			session.userData.userid = '000000000000002';
		}

		// setting the chatBase object with userId and channel
		chatBase.setPlatform(
			session.userData.userid,
			session.message.address.channelId // eslint-disable-line comma-dangle
		);

		session.userData.pageToken = pageToken;
		session.userData.isItAdmin = false;
		session.userData.userGroup = 'Cidadão'; // default group

		// default value: 'undefined'. Yes, it's only a string.
		User.findOrCreate({
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
				fb_id: session.userData.userid,
				admin: session.userData.isItAdmin,
				session: {
					dialogName: session.dialogStack()[session.dialogStack().length - 1].id,
				},
				group: session.userData.userGroup,
			},
		}).spread((user, created) => {
			// console.log(`state: ${Object.values(session.dialogStack()
			// [session.dialogStack().length - 1].state)}`);
			// console.log(user.get({ plain: true })); // prints user data
			// console.log(`Was created? => ${created}`);

			if (created === true) {
				chatBase.MessageHandled('New-User', 'Im a new user interacting for the first time');
			} else {
				chatBase.MessageHandled('Old-User', 'Im an old user interacting again');
			}

			// Don't reset admin group to normal default nor admin deault
			if (user.get('group') !== 'Cidadão' && user.get('group') !== process.env.adminGroup) {
				session.userData.userGroup = user.get('group');
			}

			// it's better to always update fb_name to follow any changes the user may do
			if (session.message.address.channelId === 'facebook') {
				saveSession.userFacebook(
					session.userData.userid, session.userData.pageToken,
					(result => User.update({
						fb_name: `${result.first_name} ${result.last_name}`,
						fb_id: result.id,
					}, {
						where: {
							fb_id: {
								$eq: session.userData.userid,
							},
						},
					}).catch((err) => {
						errorLog.storeErrorLog(session, `Couldn't update facebook name => ${err}`, user.get('id'));
					})) // eslint-disable-line comma-dangle
				);
			}
			// if user was created, there's no point in updating
			// session.userData.isItAdmin === true => avoid turning admins into non-admins
			if (!created && session.userData.isItAdmin === true) {
				User.update({
					admin: session.userData.isItAdmin,
					group: session.userData.userGroup,
					sendMessage: true,
				}, {
					where: {
						fb_id: session.userData.userid,
					},
				}).then(() => {
					console.log('\nUpdated Admin status!');
				}).catch((err) => {
					console.log(`Error creating user => ${err}`);
					session.replaceDialog('/promptButtons');
				}).finally((err) => {
					if (!err) {
						session.replaceDialog('/getStarted');
					}
				});
			} else {
				session.replaceDialog('/getStarted');
			}
		}).catch((err) => {
			errorLog.storeErrorLog(session, `Error creating user at app.js! => ${err}`);
			console.log('\n\n', err);
			session.replaceDialog('/promptButtons');
		}); // eslint-disable-line comma-dangle
	},
]);

bot.dialog('/getStarted', [
	(session) => {
		session.sendTyping();
		if (!session.userData.firstRun) { // first run
			menuMessage = 'Vamos lá, como posso te ajudar?';
			session.userData.firstRun = true;
			session.send({
				attachments: [
					{
						contentType: 'image/jpeg',
						contentUrl: 'https://gallery.mailchimp.com/cdabeff22c56cd4bd6072bf29/images/8e84d7d3-bba7-43be-acac-733dd6712f78.png',
					},
				],
			});
			session.send('Olá, eu sou o Guaxi, o assistente virtual do Gastos Abertos e seu parceiro sobre dados abertos e transparência em orçamento público.');
			session.send(`Utilize os botões abaixo para seguirmos essa parceria. ${emoji.get('smile')}` +
			'\n\nQualquer dúvida, escreva uma mensagem e nos envie. Vamos responder o mais cedo possível.');
			session.send('Para retornar ao começo dessa conversa, a qualquer momento, basta digitar \'começar\'.');

			User.findOne({ // checks if user has an address and asks permission if he doesn't
				attributes: ['receiveMessage'],
				where: { fb_id: session.userData.userid },
			}).then((user) => {
				if (user.receiveMessage === null) {
					session.replaceDialog('/askPermission');
				} else {
					session.replaceDialog('/promptButtons');
				}
			}).catch((err) => {
				errorLog.storeErrorLog(session, `Error finding user for permission! => ${err}`);
				session.replaceDialog('/promptButtons');
			});
		} else { // welcome back
			menuMessage = 'Como posso te ajudar?';
			session.send('Olá, parceiro! Bem vindo de volta!');
			session.replaceDialog('/promptButtons');
		}
	},
]);

bot.dialog('/promptButtons', [
	(session, args, next) => { // adds admin menu to admin
		saveSession.updateSession(session.userData.userid, session);
		menuOptions = [GastosAbertosInformation, Missions, InformationAcessRequest];
		User.findOne({
			where: { fb_id: session.userData.userid },
		}).then((user) => {
			if (user.sendMessage === true && user.group !== 'Cidadão') {
				menuOptions.push(messageMenu);
			}
			if (user.admin === true) {
				menuOptions.push(adminPanel);
			}
		}).catch((err) => {
			errorLog.storeErrorLog(session, `Error finding user for adminPanel! => ${err}`);
			session.replaceDialog('/promptButtons');
		}).finally(() => {
			next();
		});
	},

	(session) => {
		builder.Prompts.choice(
			session, menuMessage, menuOptions,
			{
				listStyle: builder.ListStyle.button,
				// disableRecognizer: false,
				// recognizeChoices: false,
				// // if true, the prompt will attempt to recognize numbers in the users utterance as the
				// index of the choice to return. The default value is "true".</param>
				// recognizeNumbers: false,
				// // if true, the prompt will attempt to recognize ordinals like "the first one" or "the
				// second one" as the index of the choice to return. The default value is "true".</param>
				// recognizeOrdinals: false,
				// // if true, the prompt will attempt to recognize the selected value using the choices
				// themselves. The default value is "true".</param>
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
			case Missions:
				session.beginDialog('game:/');
				break;
			case messageMenu:
				// session.beginDialog('/csv');
				session.beginDialog('sendMessageMenu:/');
				break;
			case adminPanel:
				session.beginDialog('panelAdmin:/');
				break;
			default: // InformationAcessRequest
				session.beginDialog('informationAccessRequest:/');
				break;
			}
		}
	},
	(session) => {
		session.replaceDialog('/promptButtons');
	},
// ]);
]).customAction({
	matches: /^[\s\S]*/,
	onSelectAction: (session) => {
		custom.allIntents(session, intents, ((response) => {
			if (response === 'error') {
				chatBase.msgUnhandled(`Free-Text+${response}`, session.message.text);
				session.beginDialog('contact_doubt:/receives', { userMessage: session.message.text });
			} else {
				chatBase.MessageHandled(`Free-Text+${response}`, session.message.text);
				session.replaceDialog(response);
			}
		}));
	},
});

bot.dialog('/askPermission', [
	(session) => {
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
				chatBase.MessageHandled('New-User-Accepts Messages', 'Im a new user and I want to receive messages');
				User.update({
					address: session.message.address,
					receiveMessage: true,
				}, {
					where: { fb_id: session.userData.userid },
					returning: true,
				}).catch((err) => {
					errorLog.storeErrorLog(session, `Error updating user permission[Yes]! => ${err}`);
				});
				break;
			default: // No
				session.send(`Tranquilo! Se quiser, você poderá se inscrever no menu de informações. ${emoji.get('smile')}`);
				chatBase.MessageHandled('New-User-Doesnt accept msgs', 'Im a new user and I dont want to receive messages');
				User.update({
					address: session.message.address,
					receiveMessage: false,
				}, {
					where: { fb_id: session.userData.userid },
					returning: true,
				}).catch((err) => {
					errorLog.storeErrorLog(session, `Error updating user permission[No]! => ${err}`);
				});
				break;
			}
			session.replaceDialog('/promptButtons');
		}
	},
]);

// bot.dialog('/csv', [
// 	(session) => {
// 		const stream = fs.createReadStream(`${__dirname}/guaxi.csv`);
// 		csv
// 			.fromStream(stream, { headers: true })
// 			.on('data', (data) => {
// 				console.log(`\n${JSON.stringify(data)}`);
// 				console.log(data['Nome no Facebook']);
//
// 				User.create({
// 					name: data['Nome Cadastrado'],
// 					occupation: 'undefined',
// 					email: 'undefined',
// 					birth_date: 'undefined',
// 					state: data.Estado,
// 					city: data['Município'],
// 					cellphone_number: 'undefined',
// 					active: true,
// 					approved: true,
// 					fb_id: data['ID do Facebook'],
// 					fb_name: data['Nome no Facebook'],
// 					admin: data['É administrador'],
// 					session: {
// 						dialogName: session.dialogStack()[session.dialogStack().length - 1].id,
// 					},
// 					group: data.Grupo,
// 				});
// 			})
// 			.on('end', () => {
// 				console.log('done');
// 			});
//
// 		session.endDialog();
// 	},
// ]);
