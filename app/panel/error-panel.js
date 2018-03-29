/* global bot:true builder:true */
/* eslint no-param-reassign: ["error", { "props": true,
"ignorePropertyModificationsFor": ["session"] }] */
// the menu to see the error logs

const library = new builder.Library('errorLog');

const User = require('../server/schema/models').user;
const errorLog = require('../server/schema/models').error_log;

const arrayData = []; // data from user_message
const arrayName = []; // only user_name from user_message
const writeAnswer = 'Escrever resposta';
const markAnswered = 'Marcar como respondida';
const Confirm = 'Enviar';
const Cancel = 'Voltar';
let lastIndex = 0;
let errorData = '';
let adminData = '';
let adminMessage = '';

function sendAnswerToError(user, Message, session) {
	let userSend;
	User.findOne({
		attributes: ['id', 'fb_name', 'address', 'session'],
		where: { id: user.user_id },
	}).then((userData) => {
		userSend = userData;
	}).catch((err) => {
		session.send(`Erro: => ${err}`);
	}).finally(() => {
		bot.beginDialog(userSend.address, '*:/sendAnswerToError', {
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
		errorLog.findAndCountAll({ // list all unanswered userMessages
			order: [['updatedAt', 'DESC']], // order by oldest message
			limit: 10,
			where: {
				resolved: {
					$ne: true,
				},
			},
		}).then((listError) => {
			if (listError.count === 0) {
				session.send('Ufa! Não temos nenhum erro! :)');
				session.replaceDialog('panelAdmin:/');
			} else {
				session.send(`Encontrei ${listError.count} erro(s).`);
				listError.rows.forEach((element) => {
					arrayData.push({
						id: element.dataValues.id,
						user_id: element.dataValues.user_id,
						user_name: element.dataValues.user_name,
						error_message:	element.dataValues.error_message,
						dialog_stack:	element.dataValues.dialog_stack,
						createdAt: element.dataValues.createdAt,
					});
					// space at the end turns number id to string
					// Necessary because builder.prompts needs string
					arrayName.push(`${element.dataValues.user_id} `);
				});
				next();
			}
		}).catch((err) => {
			session.send(`Ironicamente, ocorreu um erro ao pesquisar erros => ${err}`);
			session.replaceDialog('panelAdmin:/');
		});
	},
	(session) => {
		User.findOne({ // Getting useful admin information!
			attributes: ['id', 'fb_name'],
			where: { fb_id: session.userData.userid },
		}).then((userData) => {
			adminData = userData;
		});
		arrayName.push(Cancel); // adds Cancel button
		lastIndex = arrayName.length;
		builder.Prompts.choice(
			session, 'Clique no id abaixo para ver e responder o erro. O erro mais novo aparece primeiro(limitando a 10 opções). ' +
			'Você poderá cancelar com a última opção.', arrayName, // <= !
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
			} else if (arrayName[result.response.index].trim() !== '0') {
				User.findOne({ // Getting user information => fb_name and address
					attributes: ['fb_name', 'address', 'session'],
					where: { id: arrayName[result.response.index].trim() }, // trim whitespace = string to int
				}).then((userData) => {
				// passing arguments to the keys in same index position as the option admin just clicked
					arrayData[result.response.index].address = userData.address;
					arrayData[result.response.index].session = userData.session;
					arrayData[result.response.index].fb_name = userData.fb_name;
					session.replaceDialog('/viewMessage', { errorData: arrayData[result.response.index], choiceOptions: [writeAnswer, markAnswered, Cancel] });
				}).catch((err) => { console.log(err); });
			} else {
				session.replaceDialog('/viewMessage', { errorData: arrayData[result.response.index], choiceOptions: [markAnswered, Cancel] });
			}
		} else {
			session.send('Obs. Parece que a opção não foi selecionada corretamente. Tente novamente.');
			session.replaceDialog('panelAdmin:/');
		}
	},
]);

library.dialog('/viewMessage', [
	(session, args) => {
		errorData = args.errorData; // eslint-disable-line prefer-destructuring
		session.send('O erro está sendo exibida abaixo. Escolha como você deseja responde-la. ' +
		'Você pode escrever um texto e manda-lo. Ou, se a mensagem não for relevante, marca-la como respondida.');
		builder.Prompts.choice(
			session, `${errorData.error_message}\n\n${errorData.fb_name} ${errorData.createdAt}`, args.choiceOptions,
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
				errorLog.update({
					resolved: true,
					admin_id: adminData.id,
				}, {
					where: {
						id: errorData.id,
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

bot.dialog('/sendAnswerToError', [
	(session, args) => {
		session.userData.dialogName = args.userDialog;
		session.userData.usefulData = args.usefulData;
		builder.Prompts.choice(
			session, args.answer, 'Ok',
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
		session.send('Sua mensagem fica como abaixo, seguida de um botão \'OK\' que leva o usuário para onde ele estava:');
		session.send(adminMessage);
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
				errorLog.update({
					resolved: false,
					admin_id: adminData.id,
					response: adminMessage,
				}, {
					where: {
						id: errorData.id,
					},
				}).then(() => {
					sendAnswerToError(errorData, adminMessage);
					session.send('Respondemos com sucesso!');
				}).catch((err) => {
					session.send(`Ocorreu um erro => ${err}`);
				}).finally(() => { session.endDialog(); });
				break;
			default: // Cancel
				session.replaceDialog('panelAdmin:/');
				break;
			}
		}
	},
]).customAction({
	matches: /^[\w]+/, // override main customAction at app.js
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
