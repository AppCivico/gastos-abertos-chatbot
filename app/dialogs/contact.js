/* global bot:true builder:true */
/* eslint no-param-reassign: ["error", { "props": true,
"ignorePropertyModificationsFor": ["session"] }] */

const library = new builder.Library('contact_doubt');
const emoji = require('node-emoji');
const errorLog = require('../misc/send_log');

bot.library(require('../panel/answer-messages'));

const User = require('../server/schema/models').user;
const userMessage = require('../server/schema/models').user_message;

const inbox = 'Ir pra caixa de entrada';
const goBack = 'Voltar';
let message;
let user;

library.dialog('/', [
	(session) => {
		session.sendTyping();
		session.send('Se estiver com alguma dúvida, digite e envie uma mensagem utilizando o campo abaixo. ' +
		`Logo entraremos em contato. ${emoji.get('smile')}` +
	'\n\nVocê também pode visitar o nosso grupo de lideranças: https://chat.whatsapp.com/Flm0oYPVLP0KfOKYlUidXS');
		session.endDialog();
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
	(session) => {
		userMessage.create({
			user_id: user.id,
			user_name: user.fb_name,
			user_address: user.address,
			content: message,
			response: false,
			answered: false,
		}).then(() => {
			session.send('Recebemos sua dúvida! Em breve, entraremos em contato.');
			User.findAll({
				attributes: ['fb_name', 'address', 'session'],
				where: {
					admin: {
						$eq: true,
					},
					id: { // excludes current user if it is an admin
						$ne: user.id,
					},
				},
			}).then((adminData) => {
				adminData.forEach((element) => {
					bot.beginDialog(element.address, '*:/sendNotification', {
						userDialog: element.session.dialogName,
						usefulData: element.session.usefulData,
					});
				});
			});
		}).catch((err) => {
			errorLog.storeErrorLog(session, `Error creating user message => ${err}`, user.id);
		}).finally(() => {
			session.replaceDialog(user.session.dialogName);
		});
	},
]);

bot.dialog('/sendNotification', [
	(session, args) => {
		session.userData.dialogName = args.userDialog;
		session.userData.usefulData = args.usefulData;
		builder.Prompts.choice(
			session, 'Recebemos uma nova dúvida! Entre na caixa de entrada para responder!', [inbox, goBack],
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
