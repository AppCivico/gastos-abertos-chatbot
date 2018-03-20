/* global  builder:true */
/* eslint no-param-reassign: ["error", { "props": true,
"ignorePropertyModificationsFor": ["session"] }] */

// the menu to send direct messages to user

const library = new builder.Library('answerMessages');

const userMessage = require('../server/schema/models').user_message;

const Cancel = 'Cancelar/Voltar';
const arrayData = []; // data from user_message
const arrayName = []; // only user_name from user_message
let lastIndex = 0;

library.dialog('/', [
	(session, args, next) => {
		arrayData.length = 0; // empty array
		arrayName.length = 0; // empty array
		userMessage.findAndCountAll({ // list all unanswered userMessages
			order: [['updatedAt', 'DESC']], // order by oldest message
			limit: 10,
			where: {
				answered: {
					$eq: false,
				},
			},
		}).then((listMessages) => {
			if (listMessages.count === 0) {
				session.send('Não encontrei nenhuma mensagem! :)');
				session.endDialog();
			} else {
				session.send(`Encontrei ${listMessages.count} mensagens.`);
				listMessages.rows.forEach((element) => {
					arrayData.push({
						id: element.dataValues.id,
						user_id: element.dataValues.user_id,
						user_name: element.dataValues.user_name,
						user_address: element.dataValues.user_address,
						content:	element.dataValues.content,
					});
					arrayName.push(element.dataValues.user_name);
				});
				next();
			}
		}).catch((err) => {
			session.send(`Ocorreu um erro ao pesquisar mensagens => ${err}`);
			session.endDialog();
		});
	},
	(session) => {
		arrayName.push(Cancel); // adds Cancel button
		lastIndex = arrayName.length;
		builder.Prompts.choice(
			session, 'Clique no nome abaixo para ver e responder a mensagem. A mensagem mais velha aparece primeiro(limitando a 10 opções). ' +
			'Você poderá cancelar com a última opção.', arrayName,
			{
				listStyle: builder.ListStyle.button,
				retryPrompt: 'Opção errada',
				maxRetries: 10,
			} // eslint-disable-line comma-dangle
		);
	},
	(session, result) => {
		session.sendTyping();
		if (result.response) {
			if (result.response.index === (lastIndex - 1)) { // check if user chose 'Cancel'
				session.endDialog();
			} else {
				session.beginDialog('/viewMessage', { messageData: arrayData[result.response.index] });
			}
		} else {
			session.send('Obs. Parece que a opção não foi selecionada corretamente. Tente novamente.');
			session.endDialog();
		}
	},
]);

library.dialog('/viewMessage', [ // TODO
	(session, args) => {
		console.log(args.messageData);
	},
]);


module.exports = library;
