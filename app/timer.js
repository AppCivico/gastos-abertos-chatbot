/* global bot:true builder:true */
/* eslint no-param-reassign: ["error", { "props": true,
"ignorePropertyModificationsFor": ["session"] }] */

// A class for adding a timer to the missions and sending warning messages

const Cron = require('cron');

const Notification = require('./server/schema/models').notification;
const User = require('./server/schema/models').user;

function sendWarning(user, text, missionID) {
	Notification.update({
		sentAlready: false, // TODO false for testing
		timeSent: new Date(Date.now()),
	}, {
		where: {
			userID: user.id,
			missionID,
		},
	}).then(() => {
		console.log('Notification updated sucessfuly');
	}).catch((err) => {
		console.log(err);
	});
	const msg = new builder.Message().address(user.address);
	msg.textLocale('pt-BR');
	msg.text(text);
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

const timerJob = new Cron.CronJob(
	'00 00 9-23/3 * * 1-5', () => {
		const d = new Date(Date.now());
		const limit = new Date(d.setHours(d.getHours() - 5)); // limit = now - N hours

		Notification.findAll({
			attributes: ['userID', 'missionID', 'msgSent'],
			where: {
				sentAlready: false,
				// createdAt: { $lte: limit }, // createdAt <= limit
			},
		}).then((listNotification) => {
			listNotification.forEach((element) => {
				console.log(`Sending notification to user ${element.userID}`);
				console.log(`Time: ${new Date(Date.now())}`);
				User.findOne({
					attributes: ['address', 'session', 'id'],
					where: {
						id: element.userID,
						address: { // search for people that accepted receiving messages(address = not null)
							$ne: null,
						},
					},
				}).then((userData) => {
					sendWarning(userData, element.msgSent, element.missionID);
				}).catch((errUser) => {
					console.log(`Coundn't find User => ${errUser}`);
				});
			});
		}).catch((errMission) => {
			console.log(`Coundn't find Notifications => ${errMission}`);
		});
	}, (() => {
		console.log('Crontab \'timer\' stopped.');
	}),
	true, /* Start the job right now (no need for timerJob.start()) */
	'America/Sao_Paulo',
	false, // context
	// runOnInit = true TODO useful only for tests
	true // eslint-disable-line comma-dangle
);

module.exports.timerJob = timerJob;
