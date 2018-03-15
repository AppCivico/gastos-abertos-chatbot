/* global  bot:true builder:true */
/* eslint no-param-reassign: ["error", { "props": true,
"ignorePropertyModificationsFor": ["session"] }] */

require('dotenv').config();
require('./connectorSetup.js')();

const retryPrompts = require('./misc/speeches_utils/retry-prompts');
const emoji = require('node-emoji');
const Timer = require('./timer'); // eslint-disable-line no-unused-vars

console.log(`Crontab MissionTimer is running? => ${Timer.MissionTimer.running}`);
console.log(`Crontab RequestTimer is running? => ${Timer.RequestTimer.running}`);

bot.library(require('./dialogs/gastos-abertos-information'));
bot.library(require('./dialogs/game'));
bot.library(require('./validators'));
bot.library(require('./panel/admin-panel'));
bot.library(require('./send-message-menu'));

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

// intents.matches('ajuda', 'gastosAbertosInformation:/');
// intents.matches('missoes', 'game:/');
// intents.matches('pedido', 'gastosAbertosInformation:/');
intents.matches('Default Welcome Intent', '/reset');
intents.matches('Default Fallback Intent', '/');

// bot.dialog('/', intents);
// console.log(`intents: ${Object.entries(intents.actions)}`);

const { pageToken } = process.env;
const adminArray = process.env.adminArray.split(',');

bot.beginDialogAction('getStarted', '/getStarted');
bot.beginDialogAction('reset', '/reset');

bot.dialog('/reset', [
	(session) => {
		session.endDialog();
		session.beginDialog('/');
	},
]);

bot.dialog('/', [
	(session) => {
		// TODO rever toda a estrura do 'cancelar'
		session.userData = {}; // TODO alinhar qual comportamento nós realmente queremos
		// TODO ver quem é admin e quem pode mandar imagem
		// TODO mundar como o crontab manda mensagem
		if (session.message.address.channelId === 'facebook') {
			session.userData.userid = session.message.sourceEvent.sender.id;
			session.userData.pageid = session.message.sourceEvent.recipient.id;
		} else {
			// hardcoded ids for testing purposes
			session.userData.userid = '000000000000001';
		}
		session.userData.pageToken = pageToken;
		session.userData.isItAdmin = false;
		session.userData.userGroup = 'Cidadão'; // default group

		// checks if user should be an admin using fb_id
		if (adminArray.includes(session.userData.userid)) {
			session.userData.isItAdmin = true;
			session.userData.userGroup = process.env.adminGroup; // default admin group
		}

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
			console.log(`state: ${Object.values(session.dialogStack()[session.dialogStack().length - 1].state)}`);
			console.log(user.get({ plain: true })); // prints user data
			console.log(`Was created? => ${created}`);

			// Don't reset admin group to normal default nor admin deault
			if (user.get('group') !== 'Cidadão' && user.get('group') !== process.env.adminGroup) {
				session.userData.userGroup = user.get('group');
			}

			// it's better to always update fb_name to follow any changes the user may do
			custom.userFacebook(
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
				}).then(() => {
					console.log('Facebook Name atualizado com sucesso!');
				}).catch((err) => {
					console.log(`Não foi possível atualizar Facebook Name => ${err}`);
				})) // eslint-disable-line comma-dangle
			);
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
			console.log(`Error creating user => ${err}`);
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
			session.send(`\n\nPara facilitar, há um menu com algumas opções sobre como podemos seguir essa parceria. ${emoji.get('smile')}`);
			session.send('Para retornar ao começo dessa conversa, a qualquer momento, basta digitar \'começar\'.');

			// TODO remover todas as menções de missão para o usuário.('Minha cidade?' deve ser trocado?)
			User.findOne({ // checks if user has an address and asks permission if he doesn't
				attributes: ['receiveMessage'],
				where: { fb_id: session.userData.userid },
			}).then((user) => {
				if (user.receiveMessage === null) {
					session.replaceDialog('/askPermission');
				} else {
					session.replaceDialog('/promptButtons');
				}
			}).catch(() => {
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
		custom.updateSession(session.userData.userid, session);
		menuOptions = [GastosAbertosInformation, Missions, InformationAcessRequest];
		User.findOne({
			attributes: ['admin', 'sendMessage'],
			where: { fb_id: session.userData.userid },
		}).then((user) => {
			if (user.sendMessage === true) {
				menuOptions.push(messageMenu);
			}
			if (user.admin === true) {
				menuOptions.push(adminPanel);
			}
		}).catch(() => {
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
				session.beginDialog('game:/');
				break;
			case messageMenu:
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
					receiveMessage: true,
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
					address: session.message.address,
					receiveMessage: false,
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
