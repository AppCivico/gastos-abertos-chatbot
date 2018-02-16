/* global bot:true builder:true */

const library = new builder.Library('sendMessage');

const User = require('../server/schema/models').user;

const writeMsg = 'Escrever Mensagem';
const imageMsg = 'Mensagem com Imagem';
const testMessage = 'Mensagem Teste(Temporário)';
const goBack = 'Voltar para o menu';
const Confirm = 'Enviar';
const Negate = 'Não enviar/Voltar';
const keepMessage = 'Continue mandando';
const stopMessage = 'Parar';

let messageText; // custom message text
let imageUrl; // desired image url
let msgCount; // counts number of messages sent

// function sendProactiveMessage(address, customMessage) {
// 	const msg = new builder.Message().address(address);
// 	msg.textLocale('pt-BR');
// 	msg.text(customMessage);
// 	bot.send(msg);
// }

// function sendProactiveImage(address, customMessage, customImage) {
// 	const textMessage = new builder.Message().address(address);
// 	textMessage.text(customMessage);
// 	textMessage.textLocale('pt-BR');
// 	const image = new builder.Message().address(address);
// 	image.addAttachment({
// 		contentType: 'image/jpeg',
// 		contentUrl: customImage,
// 	});
// 	bot.send(image);
// 	bot.send(textMessage);
// }

function startProactiveImage(address, customMessage, customImage) {
	try {
		const textMessage = new builder.Message().address(address);
		textMessage.text(customMessage);
		textMessage.textLocale('pt-BR');
		const image = new builder.Message().address(address);
		image.addAttachment({
			contentType: 'image/jpeg',
			contentUrl: customImage,
		});
		bot.send(image);
		bot.send(textMessage);
		bot.beginDialog(address, '*:/askingPermission');
	} catch (err) {
		console.log(`Erro ao enviar mensagem: ${err}`);
	}
}

function startProactiveDialog(address, customMessage) {
	try {
		msgCount = +1;
		const textMessage = new builder.Message().address(address);
		textMessage.text(customMessage);
		textMessage.textLocale('pt-BR');
		bot.send(textMessage);
		bot.beginDialog(address, '*:/askingPermission');
	} catch (err) {
		console.log(`Erro ao enviar mensagem: ${err}`);
	}
}


bot.dialog('/askingPermission', [
	(session) => {
		builder.Prompts.choice(
			session, 'Se você não desejar mais ver essas mensagens, escolha \'Parar\' abaixo',
			[keepMessage, stopMessage],
			{
				listStyle: builder.ListStyle.button,
				retryPrompt: 'Se você não desejar mais ver essas mensagens, escolha \'Parar\' abaixo',
				promptAfterAction: true,
			} // eslint-disable-line comma-dangle
		);
	},
	(session, result, next) => {
		if (result.response) {
			switch (result.response.entity) {
			case stopMessage:
				User.update({
					address: null,
				}, {
					where: {
						fb_id: session.userData.userid,
					},
					returning: true,
				})
					.then(() => {
						session.send('Pronto! Você não receberá mais as mensagens.' +
						'\n\nSe desejar se vincular novamente, vá para o menu de Informações.');
						console.log('User address updated sucessfuly');
					})
					.catch((err) => {
						session.send('Epa! Tive um problema técnico e não consegui te desvincular!' +
						'\n\nVocê pode tentar se desvincular mais tarde no menu de Informações.');
						console.log(err);
						throw err;
					});
				break;
			default: // keepMessage
				session.send('Legal! Agradecemos seu interesse!');
				break;
			}
			next();
		}
	},
	(session) => {
		session.send('Vamos voltar pro fluxo normal...');
		session.endDialog();
	},
]);

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


library.dialog('/askImage', [ // asks user for text and image URL
	(session) => {
		builder.Prompts.text(session, 'Aqui enviaremos uma imagem seguida de uma mensagem de texto logo abaixo.' +
		'\n\nDigite a mensagem de texto desejada:');
	},
	(session, args) => {
		messageText = args.response;
		builder.Prompts.text(session, 'Digite a URL da imagem desejada.' +
		'\n\nLembre-se: ela deve estar online e acessível a todos. Cuidado com o tamanho. Pode ser GIF.' +
		'\n\nExemplo: https://gallery.mailchimp.com/cdabeff22c56cd4bd6072bf29/images/8e84d7d3-bba7-43be-acac-733dd6712f78.png');
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
				fb_id: {
					$ne: session.userData.userid + 1,
				},
			},
		}).then((user) => {
			user.forEach((element) => {
				console.log(`Usuário: ${Object.entries(element.dataValues)}`);
				startProactiveImage(element.dataValues.address, messageText);
			});
			session.send(`${msgCount} mensagen(s) enviada(s) com sucesso!`);
		}).catch((err) => {
			session.send('Ocorreu um erro ao enviar mensagem');
			console.log(`Erro ao enviar mensagem: ${err}`);
		});
		next();
	},
	(session) => {
		session.replaceDialog('/');
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
				fb_id: {
					$ne: session.userData.userid + 1,
				},
			},
		}).then((user) => {
			user.forEach((element) => {
				console.log(`Usuário: ${Object.entries(element.dataValues)}`);
				startProactiveDialog(element.dataValues.address, messageText);
			});
			session.send(`${msgCount} mensagen(s) enviada(s) com sucesso!`);
		}).catch((err) => {
			session.send('Ocorreu um erro ao enviar mensagem');
			console.log(`Erro ao enviar mensagem: ${err}`);
		});
		next();
	},
	(session) => {
		session.replaceDialog('/');
	},
]);

module.exports = library;
