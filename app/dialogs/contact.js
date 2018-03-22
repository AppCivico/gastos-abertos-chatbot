/* global bot:true builder:true */
/* eslint no-param-reassign: ["error", { "props": true,
"ignorePropertyModificationsFor": ["session"] }] */

const library = new builder.Library('contact');
const emoji = require('node-emoji');

bot.library(require('../panel/answer-messages'));

const User = require('../server/schema/models').user;
const userMessage = require('../server/schema/models').user_message;

const inbox = 'Ir pra caixa de entrada';
const goBack = 'Voltar';
let user;

library.dialog('/', [
	(session) => {
		session.sendTyping();
		session.send('Se estiver com alguma dúvida, aqui você poderá mandar uma mensagem para um de nossos administradores.' +
	'\n\nVocê também pode visitar o nosso grupo de lideranças: https://chat.whatsapp.com/Flm0oYPVLP0KfOKYlUidXS');
		session.beginDialog('/userInput');
	},
]);

library.dialog('/userInput', [
	(session) => {
		User.findOne({
			attributes: ['session', 'id', 'fb_name', 'address'],
			where: { fb_id: session.userData.userid },
		}).then((userData) => {
			user = userData;
		});
		session.userData.userDoubt = '';
		builder.Prompts.text(session, 'Digite sua dúvida. Iremos te responder assim que pudermos. Evite utilizar mais de 250 caracteres. ' +
		`${emoji.get('smile')}\n\nPara cancelar, digite 'cancelar', 'começar' ou 'voltar'.`);
	},
	(session) => {
		session.replaceDialog('/receives', { userMessage: session.userData.userDoubt });
	},
]).customAction({
	matches: /^[\w]+/, // override main customAction at app.js
	onSelectAction: (session) => {
		if (/^cancel$|^cancelar$|^voltar$|^in[íi]cio$|^come[cç]ar/i.test(session.message.text)) {
			session.replaceDialog(user.session.dialogName); // cancel option
		} else {
			session.userData.userDoubt = session.message.text;
			session.endDialog();
		}
	},
});

library.dialog('/receives', [
	(session, args) => {
		userMessage.create({
			user_id: user.id,
			user_name: user.fb_name,
			user_address: user.address,
			content: args.userMessage,
			response: false,
			answered: false,
		}).then(() => {
			session.send('Recebemos sua dúvida! Em breve, entraremos em contato.');
			User.findAll({ // list all users with desired like = fb_name
				attributes: ['fb_name', 'address', 'session'],
				where: {
					admin: {
						$eq: true,
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
			console.log(`Couldn't create new message => ${err}`);
			session.send('Tivemos um problema técnico! Tente novamente mais tarde ou entre em nosso grupo!');
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
			session, 'Recebemos uma nova mensagem! Entre na caixa de entrada para responder!', [inbox, goBack],
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
