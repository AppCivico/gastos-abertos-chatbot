const Request = require('request');

// the requests that actually send the messages to the users
// using fb_id to send messages allows us to send messages to everyone

const sendImageByFbId = (userData, textMsg, UrlImage, pageToken, groupText) => {
	Request.post({
		uri: `https://graph.facebook.com/v2.6/me/messages?access_token=${pageToken}`,
		'content-type': 'application/json',
		form: {
			messaging_type: 'UPDATE',
			recipient: {
				id: userData.fb_id,
			},
			message: {
				text: groupText,
			},
		},
	}, (error, response, body) => {
		console.log('error:', error);
		console.log('statusCode:', response && response.statusCode);
		console.log('body:', body);
		Request.post({
			uri: `https://graph.facebook.com/v2.6/me/messages?access_token=${pageToken}`,
			'content-type': 'application/json',
			form: {
				messaging_type: 'UPDATE',
				recipient: {
					id: userData.fb_id,
				},
				message: {
					attachment: {
						type: 'image',
						payload: {
							url: UrlImage,
							is_reusable: true,
						},
					},
				},
			},
		}, (error2, response2, body2) => {
			console.log('error:', error2);
			console.log('statusCode:', response2 && response2.statusCode);
			console.log('body:', body2);

			Request.post({
				uri: `https://graph.facebook.com/v2.6/me/messages?access_token=${pageToken}`,
				'content-type': 'application/json',
				form: {
					messaging_type: 'UPDATE',
					recipient: {
						id: userData.fb_id,
					},
					message: {
						text: textMsg,
						quick_replies: [
							{
								content_type: 'text',
								title: 'Voltar para o início',
								payload: 'reset',
							},
						],
					},
				},
			}, (error3, response3, body3) => {
				console.log('error:', error3);
				console.log('statusCode:', response3 && response3.statusCode);
				console.log('body:', body3);
			});
		});
	});
};

module.exports.sendImageByFbId = sendImageByFbId;

const sendMessageByFbId = (userData, textMsg, pageToken, groupText) => {
	Request.post({
		uri: `https://graph.facebook.com/v2.6/me/messages?access_token=${pageToken}`,
		'content-type': 'application/json',
		form: {
			messaging_type: 'UPDATE',
			recipient: {
				id: userData.fb_id,
			},
			message: {
				text: groupText,
			},
		},
	}, (error, response, body) => {
		console.log('error:', error);
		console.log('statusCode:', response && response.statusCode);
		console.log('body:', body);
		Request.post({
			uri: `https://graph.facebook.com/v2.6/me/messages?access_token=${pageToken}`,
			'content-type': 'application/json',
			form: {
				messaging_type: 'UPDATE',
				recipient: {
					id: userData.fb_id,
				},
				message: {
					text: textMsg,
					quick_replies: [
						{
							content_type: 'text',
							title: 'Voltar para o início',
							payload: 'reset',
						},
					],
				},
			},
		}, (error2, response2, body2) => {
			console.log('error:', error2);
			console.log('statusCode:', response2 && response2.statusCode);
			console.log('body:', body2);
		});
	});
};

module.exports.sendMessageByFbId = sendMessageByFbId;

// Old method of sending messages using address
// function startProactiveImage(user, customMessage, customImage) {
// 	try {
// 		msgCount += 1;
// 		const image = new builder.Message().address(user.address);
// 		image.addAttachment({
// 			contentType: 'image/jpeg',
// 			contentUrl: customImage,
// 		});
// 		const textMessage = new builder.Message().address(user.address);
// 		textMessage.text(customMessage);
// 		textMessage.textLocale('pt-BR');
// 		bot.send(image);
// 		bot.send(textMessage);
// 	} catch (err) {
// 		console.log(`Erro ao enviar mensagem: ${err}`);
// 	} finally {
// 		bot.beginDialog(user.address, '*:/confirm', { userDialogo: user.session.dialogName,
// usefulData: user.session.usefulData });
// 	}
// }
//
// function startProactiveDialog(user, customMessage) {
// 	try {
// 		msgCount += 1;
// 		const textMessage = new builder.Message().address(user.address);
// 		textMessage.text(customMessage);
// 		textMessage.textLocale('pt-BR');
// 		bot.send(textMessage);
// 	} catch (err) {
// 		console.log(`Erro ao enviar mensagem: ${err}`);
// 	}
// 	console.log(`${user.name} vai para ${user.session.dialogName}\n\n`);
// 	bot.beginDialog(user.address, '*:/confirm', { userDialogo: user.session.dialogName,
//  usefulData: user.session.usefulData });
// }
//
// bot.dialog('/confirm', [
// 	(session, args) => {
// 		session.userData.dialogName = args.userDialogo;
// 		session.userData.usefulData = args.usefulData;
// 		builder.Prompts.choice(
// 			session, 'Você pode desativar mensagens automáticas como '+
//      'a de cima no menu de Informações.', 'Ok',
// 			{
// 				listStyle: builder.ListStyle.button,
// 			} // eslint-disable-line comma-dangle
// 		);
// 	},
// 	(session) => {
// 		const { dialogName } = session.userData; // it seems that doing this is necessary because
// 		const { usefulData } = session.userData; // session.dialogName adds '*:' at replaceDialog
// 		session.send('Voltando pro fluxo normal...');
// 		session.replaceDialog(dialogName, { usefulData });
// 	},
// ]);
// library.dialog('/sendingMessage', [ // sends text message
// 	(session, args) => {
// 		if (!args) {
// 			messageText = '<<Mensagem proativa de teste>>';
// 		} else {
// 			[messageText] = [args.messageText];
// 		}
// 		User.findAll({
// 			attributes: ['name', 'address', 'session'],
// 			where: {
// 				address: { // search for people that accepted receiving messages(address = not null)
// 					$ne: null,
// 				},
// 				fb_id: { // excludes whoever is sending the direct message
// 					$ne: session.userData.userid,
// 				},
// 			},
// 		}).then((user) => {
// 			user.forEach((element) => {
// 				console.log(`Usuário: ${Object.entries(element.dataValues)}`);
// 				startProactiveDialog(element.dataValues, messageText);
// 			});
// 		}).catch((err) => {
// 			session.send('Ocorreu um erro ao enviar mensagem');
// 			console.log(`Erro ao enviar mensagem: ${err}`);
// 		}).finally(() => {
// 			session.send(`${msgCount} mensagen(s) enviada(s) com sucesso!`);
// 			session.replaceDialog('/');
// 		});
// 	},
// ]);
