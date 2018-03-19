/* global builder:true */

const retryPrompts = require('../misc/speeches_utils/retry-prompts');
const emoji = require('node-emoji');

const library = new builder.Library('contact');

let User;

library.dialog('/', [
	(session) => {
		session.sendTyping();
		session.send('Se estiver com alguma dúvida, aqui você poderá mandar uma mensagem para um de nossos administradores.');
		session.beginDialog('/userInput');
	},
]);

library.dialog('/userInput', [
	(session) => {
		builder.Prompts.text(session, `Digite sua dúvida. Iremos te responder assim que pudermos. ${emoji.get('smile')}`);
	},
	(session, args) => {
		session.userData.userInput = args.response;
		session.send('aaa');
	},
]);

module.exports = library;
