/* global  bot:true builder:true */
/* eslint no-param-reassign: ["error", { "props": true,
"ignorePropertyModificationsFor": ["session"] }] */

// sends an image followed by a text message to users
const startProactiveImage = async (user, customMessage, customImage, group) => {
	try {
		const textGroup = new builder.Message().address(user.address);
		textGroup.text(group);

		const image = new builder.Message().address(user.address);
		image.addAttachment({
			contentType: 'image/jpeg',
			contentUrl: customImage,
		});

		const textMessage = new builder.Message().address(user.address);
		textMessage.text(customMessage);
		textMessage.textLocale('pt-BR');

		bot.send(textGroup, () => {
			bot.send(image, () => {
				bot.send(textMessage, () => {
					bot.beginDialog(user.address, '*:/confirm', {
						userDialogo: user.session.dialogName,
						usefulData: user.session.usefulData,
					});
				});
			});
		});
	} catch (err) {
		console.log(`Couldn't send Message => ${err}`);
		bot.beginDialog(user.address, '*:/confirm', {
			userDialogo: user.session.dialogName,
			usefulData: user.session.usefulData,
		});
	}
};

module.exports.startProactiveImage = startProactiveImage;

// sends a simple text message to users
const startProactiveDialog = async (user, customMessage, group) => {
	try {
		const textGroup = new builder.Message().address(user.address);
		textGroup.text(group);
		textGroup.textLocale('pt-BR');

		const textMessage = new builder.Message().address(user.address);
		textMessage.text(customMessage);
		textMessage.textLocale('pt-BR');

		// console.log(`${user.name} vai para ${user.session.dialogName}\n\n`);
		bot.send(textGroup, () => {
			bot.send(textMessage, () => {
				bot.beginDialog(user.address, '*:/confirm', {
					userDialogo: user.session.dialogName,
					usefulData: user.session.usefulData,
				});
			});
		});

		// bot.send(textMessage);
	} catch (err) {
		console.log(`Couldn't send Message => ${err}`);
		bot.beginDialog(user.address, '*:/confirm', {
			userDialogo: user.session.dialogName,
			usefulData: user.session.usefulData,
		});
	}
};

module.exports.startProactiveDialog = startProactiveDialog;

bot.dialog('/confirm', [
	(session, args) => {
		session.userData.dialogName = args.userDialogo;
		session.userData.usefulData = args.usefulData;
		builder.Prompts.choice(
			session, 'Você pode desativar mensagens automáticas como ' +
			'a de cima no menu de Informações.', 'Ok',
			{
				listStyle: builder.ListStyle.button,
			} // eslint-disable-line comma-dangle
		);
	},
	(session) => {
		const { dialogName } = session.userData; // it seems that doing this is necessary because
		const { usefulData } = session.userData; // session.dialogName adds '*:' at replaceDialog
		session.send('Voltando pro fluxo normal...');
		session.replaceDialog(dialogName, { usefulData });
	},
]);
