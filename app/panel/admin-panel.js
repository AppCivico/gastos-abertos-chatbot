/* global  bot:true builder:true */
// This class only lists the options available

const retryPrompts = require('../misc/speeches_utils/retry-prompts');

bot.library(require('./admin-message-menu'));
bot.library(require('./add-admin'));
bot.library(require('./remove-admin'));
bot.library(require('./add-group'));
bot.library(require('./remove-group'));
bot.library(require('./get-users'));
bot.library(require('./answer-messages'));
bot.library(require('./error-panel'));

const library = new builder.Library('panelAdmin');

const subMenu = 'Admin e Grupo';
const addAdmin = 'Adicionar Administrador';
const removeAdmin = 'Remover Administrador';
const addGroup = 'Adicionar à um grupo';
const removeGroup = 'Remover de grupo';
const sendMessage = 'Mensagens pra todos';
const userCSV = 'CSV e Indicadores';
const answerMessages = 'Caixa de entrada';
const errorBox = 'Log de erros';
const comeBack = 'Voltar';

library.dialog('/', [
	(session) => {
		builder.Prompts.choice(
			session, 'Esse é o menu administrativo. Muito cuidado por aqui!' +
			'\n\nEscolha o que deseja fazer:',
			[sendMessage, subMenu, userCSV, answerMessages, errorBox, comeBack],
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
			case subMenu:
				session.beginDialog('/subMenu');
				break;
			case userCSV:
				session.beginDialog('csvUser:/');
				break;
			case answerMessages:
				session.beginDialog('answerMessages:/');
				break;
			case errorBox:
				session.beginDialog('errorLog:/');
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

library.dialog('/subMenu', [
	(session) => {
		builder.Prompts.choice(
			session, 'Esse é o menu para adicionar e remover usuários em grupos ou transforma-los em administradores.' +
			'\n\nCuidado!',
			[addAdmin, removeAdmin, addGroup, removeGroup, comeBack],
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
				session.endDialog();
				break;
			}
		}
	},
	(session) => {
		session.replaceDialog('/');
	},
]);

module.exports = library;
