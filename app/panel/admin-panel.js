/* global  bot:true builder:true */
// This class only lists the options available

const retryPrompts = require('../misc/speeches_utils/retry-prompts');

bot.library(require('./send-message'));
bot.library(require('./add-admin'));
bot.library(require('./remove-admin'));
bot.library(require('./add-group'));
bot.library(require('./remove-group'));

const library = new builder.Library('panelAdmin');

const addAdmin = 'Adicionar Administrador';
const removeAdmin = 'Remover Administrador';
const addGroup = 'Adicionar usuário à um grupo';
const removeGroup = 'Remover usuário de grupo';
const sendMessage = 'Mandar Mensagems';
const comeBack = 'Voltar';

library.dialog('/', [
	(session) => {
		builder.Prompts.choice(
			session, 'Esse é o menu administrativo. Muito cuidado por aqui!' +
			'\n\nEscolha o que deseja fazer:',
			[sendMessage, addAdmin, removeAdmin, addGroup, removeGroup, comeBack],
			{
				listStyle: builder.ListStyle.button,
				retryPrompt: retryPrompts.choiceIntent,
			} // eslint-disable-line comma-dangle
		);
	},

	(session, result) => {
		session.sendTyping();
		if (result.response) {
			switch (result.response.entity) {
			case sendMessage:
				session.beginDialog('sendMessage:/');
				break;
			case addAdmin:
				session.beginDialog('addAdmin:/');
				break;
			case removeAdmin:
				session.beginDialog('removeAdmin:/');
				break;
			case addGroup:
				session.beginDialog('addGroup:/');
				break;
			case removeGroup:
				session.beginDialog('removeGroup:/');
				break;
			default: // comeBack
				session.replaceDialog('*:/promptButtons');
				break;
			}
		}
	},
	(session) => {
		session.replaceDialog('/');
	},
]);

module.exports = library;
