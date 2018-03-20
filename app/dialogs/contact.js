/* global bot:true builder:true */
/* eslint no-param-reassign: ["error", { "props": true,
"ignorePropertyModificationsFor": ["session"] }] */

const retryPrompts = require('../misc/speeches_utils/retry-prompts');
const emoji = require('node-emoji');

const User = require('../server/schema/models').user;

const library = new builder.Library('contact');

library.dialog('/', [
	(session) => {
		User.findOne({
			attributes: ['session', 'address'],
			where: { fb_id: session.userData.userid },
		}).then((user) => {
			session.userData.address = user.address;
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
		builder.Prompts.text(session, `Digite sua dúvida. Iremos te responder assim que pudermos. ${emoji.get('smile')}` +
	'Para cancelar, digite \'cancelar\', \'começar\' ou \'voltar\'.');
	},
	(session, args) => {
		session.userData.userInput = args.response;
	},
]).customAction({
	matches: /^[\w]+/, // /^cancel$|^cancelar$|^voltar$|^in[íi]cio$|^começar/i,
	onSelectAction: (session) => {
		// /^cancel$|^cancelar$|^voltar$|^in[íi]cio$|^começar/i.test(args);
		session.endDialog();
	},
});
// ]).triggerAction({
// 	matches: /^cancel$|^cancelar$|^voltar$|^in[íi]cio$|^começar/i,
// 	onSelectAction: (session) => {
// 		console.log('\n');
//
// 		session.beginDialog(session.userData.session);
// 	},
// });


module.exports = library;
