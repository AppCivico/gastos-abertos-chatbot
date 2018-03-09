/* global  bot:true builder:true */
// This class only lists the options available

const retryPrompts = require('../misc/speeches_utils/retry-prompts');

bot.library(require('./admin-message-menu'));
bot.library(require('./add-admin'));
bot.library(require('./remove-admin'));
bot.library(require('./add-group'));
bot.library(require('./remove-group'));
bot.library(require('./get-state'));

const library = new builder.Library('panelAdmin');

const addAdmin = 'Adicionar Administrador';
const removeAdmin = 'Remover Administrador';
const addGroup = 'Adicionar à um grupo';
const removeGroup = 'Remover de grupo';
const sendMessage = 'Mensagens pra todos';
const byState = 'Usuários por estado';
const comeBack = 'Voltar';

library.dialog('/', [
	(session) => {
		builder.Prompts.choice(
			session, 'Esse é o menu administrativo. Muito cuidado por aqui!' +
			'\n\nEscolha o que deseja fazer:',
			[sendMessage, addAdmin, removeAdmin, addGroup, removeGroup, byState, comeBack],
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
				session.beginDialog('adminMessageMenu:/');
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
			case byState:
				session.beginDialog('byState:/');
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
