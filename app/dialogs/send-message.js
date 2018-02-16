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
let userDialog; // user's last active dialog

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
		msgCount = +1;
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
	} catch (err) {
		console.log(`Erro ao enviar mensagem: ${err}`);
	}
	bot.beginDialog(address, '*:/askingPermission');
}

function startProactiveDialog(user, customMessage) {
	try {
		msgCount = +1;
		const textMessage = new builder.Message().address(user.address);
		textMessage.text(customMessage);
		textMessage.textLocale('pt-BR');
		bot.send(textMessage);
	} catch (err) {
		console.log(`Erro ao enviar mensagem: ${err}`);
	}
	bot.beginDialog(user.address, '*:/askingPermission', { userDialog: user.session });
}

bot.dialog('/askingPermission', [
	(session, args) => {
		[userDialog] = [args.userDialog];
		builder.Prompts.choice(
			session, 'Se você não desejar mais ver essas mensagens, escolha \'Parar\' abaixo',
			[keepMessage, stopMessage],
			{
				listStyle: builder.ListStyle.button,
				retryPrompt: 'Escolha uma das opções abaixo. Escolha \'Parar\' para não receber novas mensagens.',
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
						console.log('User address erased sucessfuly');
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
			session.send('Vamos voltar pro fluxo normal...');
			next();
		}
	},
	(session) => {
		console.log(`Estariamos indo para => ${userDialog}`);
		session.replaceDialog(userDialog);
		// session.endDialog();
	},
]);

library.dialog('/', [
	(session) => {
		msgCount = 0;
		builder.Prompts.choice(
			session, 'Este é o menu para mandarmos mensagens aos usuários!\n\nEscolha uma opção, digite o texto desejado, inclua uma imagem e confirme. Você não receberá a mensagem.',
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
	(session, args) => {
		[messageText] = [args.messageText];
		[imageUrl] = [args.imageUrl];
		User.findAll({
			attributes: ['fb_name', 'address'],
			where: {
				address: {
					$ne: null,
				},
				fb_id: {
					$ne: session.userData.userid,
				},
			},
		}).then((user) => {
			user.forEach((element) => {
				console.log(`Usuário: ${Object.entries(element.dataValues)}`);
				startProactiveImage(element.dataValues.address, messageText, imageUrl);
			});
		}).catch((err) => {
			session.send('Ocorreu um erro ao enviar mensagem');
			console.log(`Erro ao enviar mensagem: ${err}`);
		}).finally(() => {
			session.send(`${msgCount} mensagen(s) enviada(s) com sucesso!`);
			session.replaceDialog('/');
		});
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
	(session, args) => {
		console.log(`asdjfasdfasdjfjasdfjasdjfjasd:${Object.entries(session.dialogStack()[session.dialogStack().length - 1])}`);
		if (!args) {
			messageText = '<<Mensagem proativa de teste>>';
		} else {
			[messageText] = [args.messageText];
		}
		User.findAll({
			attributes: ['fb_name', 'address', 'session'],
			where: {
				address: {
					$ne: null,
				},
				fb_id: {
					$ne: session.userData.userid,
				},
			},
		}).then((user) => {
			user.forEach((element) => {
				console.log(`Usuário: ${Object.entries(element.dataValues)}`);
				startProactiveDialog(element.dataValues, messageText);
			});
		}).catch((err) => {
			session.send('Ocorreu um erro ao enviar mensagem');
			console.log(`Erro ao enviar mensagem: ${err}`);
		}).finally(() => {
			session.send(`${msgCount} mensagen(s) enviada(s) com sucesso!`);
			session.replaceDialog('/');
		});
	},
]);

module.exports = library;
