/* global bot:true builder:true */
/* eslint no-param-reassign: ["error", { "props": true,
"ignorePropertyModificationsFor": ["session"] }] */

// A class for adding a timer to the missions and sending warning messages

const UserMission = require('./server/schema/models').user_mission;
const User = require('./server/schema/models').user;

let messageTxt;

function sendWarning(user, msgToSend) {
	const msg = new builder.Message().address(user.address);
	msg.textLocale('pt-BR');
	msg.text(msgToSend);
	bot.send(msg);
	bot.beginDialog(user.address, '*:/confirmTimer', { userDialogo: user.session.dialogName, usefulData: user.session.usefulData });
}

bot.dialog('/confirmTimer', [
	(session, args) => {
		session.userData.dialogName = args.userDialogo;
		session.userData.usefulData = args.usefulData;
		builder.Prompts.choice(
			session, 'Você pode desativar mensagens automáticas como a de cima no menu de Informações.', 'Ok',
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

const timer = () => {
	const d = new Date(Date.now());
	const limit = new Date(d.setHours(d.getHours() - 5));

	UserMission.findAll({
		attributes: ['createdAt', 'completed', 'user_id', 'mission_id'],
		where: {
			completed: false,
			createdAt: { $lte: limit },
		},
	}).then((misionData) => {
		if (misionData.mission_id === 1) {
			messageTxt = 'Percebemos que você não terminou nosso processo de avaliação do portal de transparência do seu município.' +
			'\n\nSe precisar de ajuda, entre em contato conosco. :)';
		} else {
			messageTxt = 'Percebemos que você não terminou nosso processo de protocolagem da LAI.' +
			'\n\nSe precisar de ajuda, entre em contato conosco. :)';
		}
		misionData.forEach((element) => {
			console.log(`mandando para: ${element.user_id}`);
			User.findOne({
				attributes: ['address', 'session'],
				where: {
					id: element.user_id,
					address: { // search for people that accepted receiving messages(address = not null)
						$ne: null,
					},
				},
			}).then((userData) => {
				sendWarning(userData, messageTxt);
			}).catch(() => {
				console.log('Coundn\'t find User');
			});
		});
	}).catch(() => {
		console.log('Coundn\'t find UserMission');
	});
};

module.exports.timer = timer;
