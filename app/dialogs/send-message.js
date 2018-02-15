/* global bot:true builder:true */

const library = new builder.Library('sendMessage');

const User = require('../server/schema/models').user;

const writeMsg = 'Escrever Mensagem';
const imageMsg = 'Mensagem com Imagem';
const testMessage = 'Mensagem Teste(Temporário)';
const goBack = 'Voltar para o menu';
const Confirm = 'Enviar';
const Negate = 'Não enviar/Voltar';

let messageText; // custom message text
let imageUrl; // desired image url
let msgCount; // counts the number of messages sent


function sendProactiveMessage(address, customMessage) {
	const msg = new builder.Message().address(address);
	msg.textLocale('pt-BR');
	msg.text(customMessage);
	bot.send(msg);
}

function sendProactiveImage(address, customMessage, customImage) {
	const text = new builder.Message().address(address);
	text.text(customMessage);
	text.textLocale('pt-BR');

	const image = new builder.Message().address(address);
	image.addAttachment({
		contentType: 'image/jpeg',
		contentUrl: customImage,
	});
	bot.send(image);
	bot.send(text);
}

library.dialog('/', [
	(session) => {
		msgCount = 0;
		builder.Prompts.choice(
			session, 'Este é o menu para mandarmos mensagens aos usuários!\n\nO que você deseja fazer?',
			[writeMsg, imageMsg, testMessage, goBack],
			{
				listStyle: builder.ListStyle.button,
				retryPrompt: 'Por favor, utilize os botões',
				promptAfterAction: false,
			} // eslint-disable-line comma-dangle
		);
	},

	(session, result) => {
		if (result.response) {
			switch (result.response.entity) {
			case writeMsg:
				session.beginDialog('/askText');
				break;
			case imageMsg:
				session.beginDialog('/askImage');
				break;
			case testMessage:
				session.beginDialog('/sendingMessage');
				break;
			default: // goBack
				session.endDialog();
				break;
			}
		}
	},
	(session) => {
		session.endDialog();
	},
]);

library.dialog('/askText', [ // asks user for text message
	(session) => {
		builder.Prompts.text(session, 'Digite a sua mensagem. Ela será enviada a todos os usuários que ' +
		'concordaram em receber mensagens pelo Guaxi.');
	},
	(session, args) => {
		session.send('Sua mensagem aparecerá da seguinte forma para os usuários:');
		messageText = args.response;
		session.send(messageText);
		builder.Prompts.choice(
			session, 'Deseja enviar essa mensagem?',
			[Confirm, Negate],
			{
				listStyle: builder.ListStyle.button,
				retryPrompt: 'Por favor, utilize os botões',
				promptAfterAction: false,
			} // eslint-disable-line comma-dangle
		);
	},

	(session, result) => {
		if (result.response) {
			switch (result.response.entity) {
			case Confirm:
				session.beginDialog('/sendingMessage', { messageText });
				break;
			default: // Negate
				session.replaceDialog('/');
				break;
			}
		}
	},
]);

library.dialog('/sendingMessage', [ // sends text message
	(session, args, next) => {
		if (!args) {
			messageText = '<<Mensagem proativa de teste>>';
		} else {
			[messageText] = [args.messageText];
		}
		User.findAll({
			attributes: ['fb_name', 'address'],
			where: {
				address: {
					$ne: null,
				},
			},
		}).then((user) => {
			user.forEach((element) => {
				console.log(`Usuário: ${Object.entries(element.dataValues)}`);
				sendProactiveMessage(element.dataValues.address, `${messageText}`);
				msgCount += 1;
			});
		}).catch((err) => {
			session.send('Ocorreu um erro ao enviar mensagem');
			console.log(`Erro ao enviar mensagem: ${err}`);
		}).finally(() => {
			session.send(`${msgCount} mensagen(s) enviada(s) com sucesso!`);
			next();
		});
	},
	(session) => {
		session.replaceDialog('/');
	},
]);

library.dialog('/askImage', [ // asks user for text and image URL
	(session) => {
		builder.Prompts.text(session, 'Aqui enviaremos uma imagem seguida de uma mensagem de texto logo abaixo.' +
		'\n\nDigite a mensagem de texto desejada:');
	},
	(session, args) => {
		messageText = args.response;
		builder.Prompts.text(session, 'Digite a URL da imagem desejada.' +
		'\n\nLembre-se: ela deve estar online e acessível a todos. Cuidado com o tamanho.' +
		'\n\nExemplo: https://gallery.mailchimp.com/cdabeff22c56cd4bd6072bf29/images/8e84d7d3-bba7-43be-acac-733dd6712f78.png' +
		'\n\nExemplo: https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/Rotating_earth_%28large%29.gif/200px-Rotating_earth_%28large%29.gif' +
		'\n\nExemplo: /home/jordan-eokoe/Downloads/Screenshot at 2018-01-03 11-58-02.png');
	},

	(session, args) => {
		session.send('Sua mensagem aparecerá da seguinte forma para os usuários:');
		imageUrl = args.response;
		session.send({
			attachments: [
				{
					contentType: 'image/jpeg',
					contentUrl: imageUrl,
				},
			],
		});
		session.send(messageText);
		builder.Prompts.choice(
			session, 'Deseja enviar essa mensagem?',
			[Confirm, Negate],
			{
				listStyle: builder.ListStyle.button,
				retryPrompt: 'Por favor, utilize os botões',
				promptAfterAction: false,
			} // eslint-disable-line comma-dangle
		);
	},

	(session, result) => {
		if (result.response) {
			switch (result.response.entity) {
			case Confirm:
				session.beginDialog('/sendingImage', { messageText, imageUrl });
				break;
			default: // Negate
				session.replaceDialog('/');
				break;
			}
		}
	},
]);

library.dialog('/sendingImage', [ // sends image and text message
	(session, args, next) => {
		[messageText] = [args.messageText];
		[imageUrl] = [args.imageUrl];
		User.findAll({
			attributes: ['fb_name', 'address'],
			where: {
				address: {
					$ne: null,
				},
			},
		}).then((user) => {
			user.forEach((element) => {
				console.log(`Usuário: ${Object.entries(element.dataValues)}`);
				sendProactiveImage(element.dataValues.address, messageText, imageUrl);
				msgCount += 1;
			});
		}).catch((err) => {
			session.send('Ocorreu um erro ao enviar mensagem');
			console.log(`Erro ao enviar mensagem: ${err}`);
		}).finally(() => {
			session.send(`${msgCount} mensagen(s) enviada(s) com sucesso!`);
			next();
		});
	},
	(session) => {
		session.replaceDialog('/');
	},
]);

module.exports = library;
