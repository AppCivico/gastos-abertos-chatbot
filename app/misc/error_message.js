/* global  bot:true builder:true */
/* eslint no-param-reassign: ["error", { "props": true,
"ignorePropertyModificationsFor": ["session"] }] */

// Default error dialog for NLP entries
const library = new builder.Library('errorMessage');

const User = require('../server/schema/models').user;

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
				session.send('asdfasdfaf'); // TODO this
				break;
			default: // goBack
				if (session.userData.address) {
					// this simply doesn't work on the bot emulator, try running it on messenger
					bot.beginDialog(session.userData.address, session.userData.session);
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

module.exports = library;
