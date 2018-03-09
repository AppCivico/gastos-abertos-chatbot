/* global  builder:true */
/* eslint no-param-reassign: ["error", { "props": true,
"ignorePropertyModificationsFor": ["session"] }] */

// the menu to send direct messages to user
const Send = require('./send-message');

const library = new builder.Library('sendMessageMenu');

const User = require('./server/schema/models').user;

const writeMsg = 'Escrever Mensagem';
const imageMsg = 'Mensagem com Imagem';
const testMessage = 'Mensagem Teste(Temporário)';
const goBack = 'Voltar para o menu';
const Confirm = 'Enviar';
const Negate = 'Não enviar/Voltar';
const messageFrom = 'Essa é uma mensagem de ';

let messageText; // custom message text
let imageUrl; // desired image url
let msgCount; // counts number of messages sent
// let userDialog; // user's last active dialog

library.dialog('/', [
	(session, args, next) => {
		msgCount = 0;
		User.findOne({
			attributes: ['group'],
			where: { fb_id: session.userData.userid },
		}).then((userData) => {
			if (userData.group === '' || userData.group === 'Cidadão') {
				session.send(`Você parece é do grupo ${session.userData.group}. Desse jeito não poderá enviar mensagem.` +
				'\n\nPor favor, entre em contato com nossa equipe imediatamente.');
				session.endDialog();
			} else {
				session.userData.group = userData.group;
				next();
			}
		}).catch((err) => {
			console.log(`Couldn't find user => ${err}`);
			session.send('Não consegui encontrar seu grupo. Não poderemos mandar mensagems.' +
			'\n\nPor favor, entre em contato com nossa equipe imediatamente.');
			session.endDialog();
		});
	},

	(session) => {
		builder.Prompts.choice(
			session, 'Este é o menu para mandarmos mensagens aos usuários! Apenas usuários que aceitaram receber essas mensagens irão recebê-las.' +
			'\n\nEscolha uma opção, digite o texto desejado, inclua uma imagem(se for o caso), visualize como fica a mensagem e confirme. ' +
			`A mensagem será mandada em nome do grupo ${session.userData.group}. Você não receberá a mensagem. ` +
			'Com essas mensagens, o fluxo do usuário não será interrompido, continuando de onde parou.' +
			'\n\nSe você for interrompido durante esse fluxo, volte para o menu inicial com o menu ao lado. Tome cuidado!',
			[writeMsg, imageMsg, goBack],
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

// ----------------Image----------------
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
		imageUrl = args.response;
		session.send('Sua mensagem aparecerá da seguinte forma para os usuários:');
		session.send(messageFrom + session.userData.group);
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
			attributes: ['name', 'address', 'session'],
			where: {
				receiveMessage: { // search for people that accepted receiving messages
					$eq: true,
				},
				fb_id: { // excludes whoever is sending the direct message
					$ne: session.userData.userid,
				},
			},
		}).then((user) => {
			user.forEach((element) => {
				Send.startProactiveImage(
					element.dataValues, messageText, imageUrl,
					messageFrom + session.userData.group // eslint-disable-line comma-dangle
				);
				msgCount += 1;
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

// ----------------Text----------------
library.dialog('/askText', [ // asks user for text message
	(session) => {
		builder.Prompts.text(session, 'Digite a sua mensagem. Ela será enviada a todos os usuários que ' +
		'concordaram em receber mensagens pelo Guaxi.');
	},
	(session, args) => {
		messageText = args.response;
		session.send('Sua mensagem aparecerá da seguinte forma para os usuários:');
		session.send(messageFrom + session.userData.group);
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
		if (!args) {
			messageText = '<<Mensagem proativa de teste>>';
		} else {
			[messageText] = [args.messageText];
		}
		User.findAll({
			attributes: ['name', 'address', 'session'],
			where: {
				receiveMessage: { // search for people that accepted receiving messages
					$eq: true,
				},
				fb_id: { // excludes whoever is sending the direct message
					$ne: session.userData.userid,
				},
			},
		}).then((user) => {
			user.forEach((element) => {
				console.log(`Usuário: ${Object.entries(element.dataValues)}`);
				Send.startProactiveDialog(
					element.dataValues, messageText,
					messageFrom + session.userData.group // eslint-disable-line comma-dangle
				);
				msgCount += 1;
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
