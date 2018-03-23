/* global bot:true builder:true */
/* eslint no-param-reassign: ["error", { "props": true,
"ignorePropertyModificationsFor": ["session"] }] */

const errorLog = require('../server/schema/models').error_log;
const User = require('../server/schema/models').user;

const goBack = 'Voltar';

const errorBox = 'Log de erros';

const storeErrorLog = (session, error, userID = 0, userName) => {
	errorLog.create({
		user_id: userID,
		user_name: userName,
		error_message: 'O diabo que me carregue',
		dialog_stack: session.dialogStack(),
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

module.exports.storeErrorLog = storeErrorLog;

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
				session.replaceDialog('errorLog:/', { usefulData });
				break;
			default: // goBack
				session.send('Voltando pro fluxo normal...');
				session.replaceDialog(dialogName, { usefulData });
				break;
			}
		}
	},
]);
