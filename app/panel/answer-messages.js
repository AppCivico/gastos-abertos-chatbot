/* global bot:true builder:true */
/* eslint no-param-reassign: ["error", { "props": true,
"ignorePropertyModificationsFor": ["session"] }] */
// the menu to send direct messages to user

const library = new builder.Library('answerMessages');

// bot.library(require('../dialogs/contact'));

const User = require('../server/schema/models').user;
const userMessage = require('../server/schema/models').user_message;

const arrayData = []; // data from user_message
const arrayName = []; // only user_name from user_message
const writeAnswer = 'Escrever resposta';
const markAnswered = 'Marcar como respondida';
const Confirm = 'Enviar';
const Cancel = 'Voltar';
let lastIndex = 0;
let messageData = '';
let adminData = '';
let adminMessage = '';

function sendAnswer(user, Message, session) {
	let userSend;
	User.findOne({
		attributes: ['id', 'fb_name', 'address', 'session'],
		where: { id: user.user_id },
	}).then((userData) => {
		userSend = userData; // getting admin user_ID
	}).catch((err) => {
		session.send(`Erro: => ${err}`);
	}).finally(() => {
		bot.beginDialog(userSend.address, '*:/sendAnswer', {
			userDialog: userSend.session.dialogName,
			usefulData: userSend.session.usefulData,
			answer: Message,
		});
	});
}

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
				session.replaceDialog('panelAdmin:/');
			} else {
				session.send(`Encontrei ${listMessages.count} mensagens.`);
				listMessages.rows.forEach((element) => {
					arrayData.push({
						id: element.dataValues.id,
						user_id: element.dataValues.user_id,
						user_name: element.dataValues.user_name,
						user_address: element.dataValues.user_address,
						content:	element.dataValues.content,
						createdAt: element.dataValues.createdAt,
					});
					arrayName.push(element.dataValues.user_name);
				});
				next();
			}
		}).catch((err) => {
			session.send(`Ocorreu um erro ao pesquisar mensagens => ${err}`);
			session.replaceDialog('panelAdmin:/');
		});
	},
	(session) => {
		arrayName.push(Cancel); // adds Cancel button
		lastIndex = arrayName.length;
		builder.Prompts.choice(
			session, 'Clique no nome abaixo para ver e responder a mensagem. A mensagem mais nova aparece primeiro(limitando a 10 opções). ' +
			'Você poderá cancelar com a última opção.', arrayName,
			{
				listStyle: builder.ListStyle.button,
			} // eslint-disable-line comma-dangle
		);
	},
	(session, result) => {
		session.sendTyping();
		if (result.response) {
			if (result.response.index === (lastIndex - 1)) { // check if user chose 'Cancel'
				session.replaceDialog('panelAdmin:/');
			} else {
				session.replaceDialog('/viewMessage', { messageData: arrayData[result.response.index] });
			}
		} else {
			session.send('Obs. Parece que a opção não foi selecionada corretamente. Tente novamente.');
			session.replaceDialog('panelAdmin:/');
		}
	},
]);

library.dialog('/viewMessage', [
	(session, args) => {
		User.findOne({
			attributes: ['id', 'fb_name'],
			where: { fb_id: session.userData.userid },
		}).then((userData) => {
			adminData = userData; // getting admin user_ID
		});
		messageData = args.messageData; // eslint-disable-line prefer-destructuring
		session.send('A mensagem está sendo exibida abaixo. Escolha como você deseja responde-la. ' +
		'Você pode escrever um texto e manda-lo. Ou, se a mensagem não for relevante, marca-la como respondida.');
		builder.Prompts.choice(
			session, `${messageData.content}\n\n${messageData.user_name} - ${messageData.createdAt}`, [writeAnswer, markAnswered, Cancel],
			{
				listStyle: builder.ListStyle.button,
			} // eslint-disable-line comma-dangle
		);
	},
	(session, result) => {
		session.sendTyping();
		if (result.response) {
			switch (result.response.entity) {
			case writeAnswer:
				session.beginDialog('/writeMessage');
				break;
			case markAnswered:
				userMessage.update({
					answered: true,
					admin_id: adminData.id,
				}, {
					where: {
						id: messageData.id,
					},
				}).then(() => {
					session.send('Marcado como respondida com sucesso!');
				}).catch((err) => {
					session.send(`Ocorreu um erro => ${err}`);
				}).finally(() => {
					session.replaceDialog('panelAdmin:/');
				});
				break;
			default: // Cancel
				session.replaceDialog('panelAdmin:/');
				break;
			}
		}
	},
]);

bot.dialog('/sendAnswer', [
	(session, args) => {
		session.userData.dialogName = args.userDialog;
		session.userData.usefulData = args.usefulData;
		session.send(args.answer);
		builder.Prompts.choice(
			session, 'Se tiver outra dúvida, basta enviar outra mensagem.', 'Ok',
			{
				listStyle: builder.ListStyle.button,
			} // eslint-disable-line comma-dangle
		);
	},
	(session) => {
		const { dialogName } = session.userData; // it seems that doing this is necessary because
		const { usefulData } = session.userData; // session.dialogName adds '*:' at replaceDialog
		session.replaceDialog(dialogName, { usefulData });
	},
]);

library.dialog('/writeMessage', [
	(session) => {
		console.log(adminData.fb_name);
		if (/^undef$|^undefined$|^null$|^undefined undefined$/i.test(adminData.fb_name)) { // stop 'undefined' to pass as admin name
			adminData.fb_name = 'a Administração.';
		}
		builder.Prompts.text(session, 'Digite sua mensagem. Ela será enviada diretamente ao usuário e ' +
		'incluirá uma assinatura com seu nome no final. Evite passar de 200 caracteres. :)');
	},
	(session) => {
		adminMessage = `${session.userData.userInput}\n\nAtenciosamente, ${adminData.fb_name}`; // comes from customAction
		session.send('Sua mensagem fica como abaixo, seguida da outra mensagem e do botão \'OK\' que leva o usuário para onde ele estava:');
		session.send(adminMessage);
		session.send('Se tiver mais alguma dúvida, basta enviar outra mensagem.');
		builder.Prompts.choice(
			session, 'Deseja enviá-la?', [Confirm, Cancel],
			{
				listStyle: builder.ListStyle.button,
			} // eslint-disable-line comma-dangle
		);
	},
	(session, result) => {
		session.sendTyping();
		if (result.response) {
			switch (result.response.entity) {
			case Confirm:
				userMessage.update({
					answered: true,
					admin_id: adminData.id,
					response: adminMessage,
				}, {
					where: {
						id: messageData.id,
					},
				}).then(() => {
					sendAnswer(messageData, adminMessage);
					session.send('Respondemos com sucesso!');
				}).catch((err) => {
					session.send(`Ocorreu um erro => ${err}`);
				}).finally(() => {
					session.replaceDialog('panelAdmin:/');
				});
				break;
			default: // Cancel
				session.replaceDialog('panelAdmin:/');
				break;
			}
		}
	},
]).customAction({
	matches: /^[\s\S]*/, // override main customAction at app.js
	onSelectAction: (session) => {
		if (/^cancel$|^cancelar$|^voltar$|^in[íi]cio$|^come[cç]ar/i.test(session.message.text)) {
			session.replaceDialog(session.userData.session); // cancel option
		} else {
			session.userData.userInput = session.message.text;
			session.endDialog();
		}
	},
});


module.exports = library;
