/* global builder:true */
/* eslint no-param-reassign: ["error", { "props": true,
"ignorePropertyModificationsFor": ["session"] }] */

const library = new builder.Library('contact');
const emoji = require('node-emoji');

const User = require('../server/schema/models').user;
const userMessage = require('../server/schema/models').user_message;

let user;
library.dialog('/', [
	(session) => {
		User.findOne({
			attributes: ['session', 'id', 'fb_name', 'address'],
			where: { fb_id: session.userData.userid },
		}).then((userData) => {
			user = userData;
			session.userData.id = user.id;
			session.userData.session = user.session.dialogName;
			console.log(session.userData.session);
		});
		session.sendTyping();
		session.send('Se estiver com alguma dúvida, aqui você poderá mandar uma mensagem para um de nossos administradores.' +
	'\n\nVocê também pode visitar o nosso grupo de lideranças: https://chat.whatsapp.com/Flm0oYPVLP0KfOKYlUidXS');
		session.beginDialog('/userInput');
	},
]);

library.dialog('/userInput', [
	(session) => {
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
			session.replaceDialog(session.userData.session); // cancel option
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
			session.send('Recebemos sua dúvida com sucesso! Em breve, entraremos em contato.');
		}).catch((err) => {
			console.log(`Couldn't create new message => ${err}`);
			session.send('Tivemos um problema técnico! Tente novamente mais tarde ou entre em nosso grupo!');
		}).finally(() => {
			session.replaceDialog(session.userData.session);
		});
	},
]);

module.exports = library;
