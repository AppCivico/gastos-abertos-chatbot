/* global bot:true builder:true */
/* eslint no-param-reassign: ["error", { "props": true,
"ignorePropertyModificationsFor": ["session"] }] */

const library = new builder.Library('contact');
const emoji = require('node-emoji');
const User = require('../server/schema/models').user;

library.dialog('/', [
	(session) => {
		User.findOne({
			attributes: ['session', 'address'],
			where: { fb_id: session.userData.userid },
		}).then((user) => {
			// session.userData.address = user.address;
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
		builder.Prompts.text(session, `Digite sua dúvida. Iremos te responder assim que pudermos. ${emoji.get('smile')} ` +
		'Evite utilizar mais de 500 caracteres.\n\nPara cancelar, digite \'cancelar\', \'começar\' ou \'voltar\'.');
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
		session.send('Sua dúvida é:');
		session.send(args.userMessage);
	},
]);

// ]).triggerAction({
// 	matches: /^cancel$|^cancelar$|^voltar$|^in[íi]cio$|^começar/i,
// 	onSelectAction: (session) => {
// 		console.log('\n');
//
// 		session.beginDialog(session.userData.session);
// 	},
// });


module.exports = library;
