/* global bot:true builder:true chatBase:true */
/* eslint no-param-reassign: ["error", { "props": true,
"ignorePropertyModificationsFor": ["session"] }] */

const library = new builder.Library('contact_doubt');
const emoji = require('node-emoji');
const errorLog = require('../misc/send_log');
const saveSession = require('../misc/save_session');

bot.library(require('../panel/answer-messages'));

const User = require('../server/schema/models').user;
const userMessage = require('../server/schema/models').user_message;

const inbox = 'Ir pra caixa de entrada';
const goBack = 'Voltar';
// the limit to check if a user text if part of the same message(also used in the timer)
const limit = (60000 * 3); // 3 minutes
let timer; // setTimeout = warn admin after the limit has passed
let message;
let user;
let names = '';


library.dialog('/', [
	async (session) => {
		session.sendTyping();
		await chatBase.getTinyUrl(chatBase.trackLink('https://chat.whatsapp.com/Flm0oYPVLP0KfOKYlUidXS', session.message.address.channelId), (response) => {
			session.send('Se estiver com alguma dúvida, digite e envie uma mensagem utilizando o campo abaixo. ' +
				`Logo entraremos em contato. ${emoji.get('smile')}` +
				`\n\nVocê também pode visitar o nosso grupo de lideranças: ${response}`);
			session.endDialog();
		});
	},
]);

library.dialog('/receives', [
	(session, args, next) => {
		message = args.userMessage;
		User.findOne({
			where: { fb_id: session.userData.userid },
		}).then((userData) => {
			user = userData; // getting admin user_ID
		}).catch((err) => {
			errorLog.storeErrorLog(session, `Error findind User => ${err}`, user.id);
		}).finally(() => {
			next();
		});
	},
	(session, args, next) => {
		// Checks if a certain period of time has passed since last user message(if it exists).
		// if so, then that message is a new message!
		// If not, then we can add the new message as part of the last message.
		userMessage.findAll({
			attributes: ['updatedAt', 'id', 'content'],
			where: {
				user_id: {
					$eq: user.id,
				},
				answered: { // not answered already
					$ne: true,
				},
			},
		}).then((userMessageList) => {
			if (userMessageList.length === 0) { // no messages from this user
				userMessage.create({
					user_id: user.id,
					user_name: user.fb_name,
					user_address: user.address,
					content: message,
					answered: false,
				}).then(() => {
					session.send('Recebemos sua dúvida! Entraremos em contato o mais cedo possível.');
					next();
				});
			} else {
				// can be a little buggy if another user sends a message in the 'limit' time window
				// clearing timer so we don't warn the admins more than once
				clearTimeout(timer);
				// gets the highest value for updatedAt
				const lastUpdated = Math.max(...userMessageList.map(o => o.updatedAt));
				// gets the object with the highest value for updatedAt ^
				const lastMessage = userMessageList.find(x =>
					(x.updatedAt >= lastUpdated) && (x.updatedAt <= lastUpdated));
				// === is not accepted in JS when comparing dates so we're verifying both <= and >=
				if ((Date.now() - lastMessage.updatedAt) <= limit) { // Checks if enough time has passed
					userMessage.update({ // adds new message text to old message
						content: `${lastMessage.content} ${message}`, // old text + white_space + new text
					}, {
						where: {
							id: lastMessage.id,
						},
					}).then(() => {
						session.send('Entendido! Te respondendemos em breve.' +
								'\n\nEnquanto isso, por que não explorar nosso bot? Utilize nossos botões para interagir!');
						next();
					}).catch((err) => {
						errorLog.storeErrorLog(session, `Error findind User => ${err}`, user.id);
					});
				} else { // creates new user message
					userMessage.create({
						user_id: user.id,
						user_name: user.fb_name,
						user_address: user.address,
						content: message,
						answered: false,
					}).then(() => {
						session.send('Recebemos sua dúvida! Em breve, entraremos em contato.');
						next();
					});
				}
			}
		}).catch((err) => {
			errorLog.storeErrorLog(session, `Error findind User => ${err}`, user.id);
		});
	},
	(session) => { // warns admins and gives feedback to the user
		timer = setTimeout(() => {
			// group by so it doesn't repeat the message in case of duplicates on the database
			User.findAll({
				attributes: ['fb_id'],
				group: 'fb_id',
				where: {
					admin: { // search for admins
						$eq: true,
					},
					fb_id: {
						$ne: session.userData.userid, // excludes current user if it is an admin
					},
				},
			}).then((userList) => {
				// sends each message individually
				userList.forEach((element) => {
					User.findOne({
						attributes: ['address', 'session', 'fb_name'],
						where: {
							fb_id: {
								$eq: element.fb_id,
							},
						},
					}).then((userData) => {
						bot.beginDialog(userData.address, '*:/sendNotification', {
							userDialog: userData.session.dialogName,
							usefulData: userData.session.usefulData,
						});
					}).catch((err) => {
						errorLog.storeErrorLog(session, `Error findind User => ${err}`, user.id);
					});
				});
			}).catch((err) => {
				errorLog.storeErrorLog(session, `Error findind User => ${err}`, user.id);
			});
		}, limit);
		session.replaceDialog(user.session.dialogName);
	},
]);

bot.dialog('/sendNotification', [
	(session, args, next) => {
		session.userData.dialogName = args.userDialog;
		session.userData.usefulData = args.usefulData;

		saveSession.userFacebook(
			session.userData.userid, session.userData.pageToken,
			((result, error) => {
				names = `${result.first_name} ${result.last_name}`;
				if (error || (result.first_name === undefined) || (result.last_name === undefined)) {
					names = 'um cidadão';
				}
				next();
			}) // eslint-disable-line comma-dangle
		);
	},
	(session) => {
		builder.Prompts.choice(
			session, `Recebemos uma nova dúvida de ${names}.\n\n Entre na caixa de entrada para responder!`, [inbox, goBack],
			{
				listStyle: builder.ListStyle.button,
			} // eslint-disable-line comma-dangle
		);
	},
	(session, result) => {
		const { dialogName } = session.userData; // it seems that doing this is necessary because
		const { usefulData } = session.userData; // session.dialogName adds '*:' at replaceDialog
		if (result.response) {
			switch (result.response.entity) {
			case inbox:
				session.replaceDialog('answerMessages:/', { usefulData });
				break;
			default: // goBack
				session.send('Voltando pro fluxo normal...');
				session.replaceDialog(dialogName, { usefulData });
				break;
			}
		}
	},
]);

module.exports = library;
