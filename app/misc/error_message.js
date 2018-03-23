/* global bot:true builder:true */
/* eslint no-param-reassign: ["error", { "props": true,
"ignorePropertyModificationsFor": ["session"] }] */

// Default error dialog for NLP entries
const library = new builder.Library('errorMessage');
bot.library(require('../dialogs/contact'));

const User = require('../server/schema/models').user;
const errorLog = require('../server/schema/models').error_log;

const errorBox = 'Log de erros';
const messageHelp = 'Contato';
const goBack = 'Voltar';

const emoji = require('node-emoji');

library.dialog('/messageHelp', [
	(session) => {
		User.findOne({
			attributes: ['session', 'address'],
			where: { fb_id: session.userData.userid },
		}).then((user) => {
			session.userData.address = user.address;
			session.userData.session = user.session.dialogName;
			console.log(session.userData.session);
		});
		builder.Prompts.choice(
			session, 'Não entendi essa opção. Se estiver com alguma dúvida, mande-nos uma mensagem escolhendo a opção \'contato\' abaixo.' +
			`\n\nVocê também pode voltar para onde estava. ${emoji.get('smile')}`, [messageHelp, goBack],
			{
				listStyle: builder.ListStyle.button,
			} // eslint-disable-line comma-dangle
		);
	},
	(session, result) => {
		session.sendTyping();
		if (result.response) {
			switch (result.response.entity) {
			case messageHelp:
				session.replaceDialog('contact:/userInput');
				break;
			default: // goBack
				if (session.userData.session) {
					session.replaceDialog(session.userData.session);
				}	else {
					session.replaceDialog('*:/promptButtons');
				}
				break;
			}
		}
	},
	(session) => {
		session.replaceDialog(session.userData.whereTo);
	},
]);

const storeErrorLog = (session, error, userID) => {
	errorLog.create({
		user_id: userID,
		error_message: error,
		dialog_stack: session,
	}).then(() => {
		User.findAll({
			attributes: ['address', 'session'],
			where: {
				receiveMessage: { // search for people that accepted receiving messages
					$ne: false,
				},
				admin: { // excludes whoever is sending the direct message
					$eq: true,
				},
				// fb_name: {
				// 	$iLike: '%Jordan Victor Scher%', // case insensitive
				// },
			},
		}).then((listAdmin) => {
			listAdmin.forEach((element) => {
				bot.beginDialog(element.address, '*:/sendErrorNotification', {
					userDialog: element.session.dialogName,
					usefulData: element.session.usefulData,
				});
			});
		});
	});
};

bot.dialog('/sendErrorNotification', [
	(session, args) => {
		session.userData.dialogName = args.userDialog;
		session.userData.usefulData = args.usefulData;
		builder.Prompts.choice(
			session, 'Ocorreu um erro! Entre na caixa de entrada para responder!', [errorBox, goBack],
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
			case errorBox:
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
