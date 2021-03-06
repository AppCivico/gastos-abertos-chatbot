/* global bot:true builder:true */
/* eslint no-param-reassign: ["error", { "props": true,
"ignorePropertyModificationsFor": ["session"] }] */

// A class for adding a timer to the missions and sending warning messages

const Sequelize = require('sequelize');
const Cron = require('cron');

const Notification = require('./server/schema/models').notification;
const User = require('./server/schema/models').user;

bot.library(require('./dialogs/second_mission/conclusion'));

function missionWarning(user, text, missionID) {
	Notification.update({
		sentAlready: true, // TODO false for testing
		timeSent: new Date(Date.now()),
		numberSent: 1, // Sequelize.literal('numberSent + 1'),
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

// Cronjob for mission 1 and 2 (request generation)
const MissionTimer = new Cron.CronJob(
	'00 00 9-23/3 * * 1-6', () => { // (Hopefully) Every 3 hours from 9-23h except on sundays
		const d = new Date(Date.now());
		const limit = new Date(d.setHours(d.getHours() - 5)); // limit = now - N hour(s)

		Notification.findAll({
			attributes: ['userID', 'missionID', 'msgSent'],
			where: {
				sentAlready: false,
				missionID: {
					$lte: 2,
				},
				createdAt: { $lte: limit }, // createdAt <= limit
			},
		}).then((listNotification) => {
			listNotification.forEach((element) => {
				console.log(`Sending mission notification to user ${element.userID}`);
				console.log(`Time: ${new Date(Date.now())}`);
				User.findOne({
					attributes: ['address', 'session', 'id'],
					where: {
						id: element.userID,
						receiveMessage: {
							$ne: false,
						},
					},
				}).then((userData) => {
					missionWarning(userData, element.msgSent, element.missionID);
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
	true, /* Starts the job right now (no need for MissionTimer.start()) */
	'America/Sao_Paulo',
	false, // context
	// Below: runOnInit = true TODO useful only for tests
	false // eslint-disable-line comma-dangle
);

module.exports.MissionTimer = MissionTimer;

function requestWarning(user, missionID) {
	Notification.update({
		timeSent: new Date(Date.now()), // last one sent
		numberSent: Sequelize.literal('"numberSent" + 1'),
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
	msg.text('Olá, parceiro! Detectei que você conseguiu gerar um pedido de acesso a informação.' +
	'\nVocê poderia me responder algumas perguntinhas?');
	bot.send(msg);
	bot.beginDialog(user.address, 'secondMissionConclusion:/secondMissionQuestions', { usefulData: user.session.usefulData });
}

// Cronjob for following the user after request generation
const RequestTimer = new Cron.CronJob(
	'00 20 9-23/3 * * 1-6', () => { // (Hopefully) On the 10th minute Every 3 hours from 9-23h except on sundays
		// const d = new Date(Date.now());
		// const limit = new Date(d.setDate(d.getDate() - 2)); // limit = now - N day(s)
		let data;
		Notification.findAll({
			attributes: ['userID', 'missionID', 'msgSent', 'updatedAt', 'createdAt', 'numberSent'],
			where: {
				sentAlready: false,
				missionID: 3,
				numberSent: {
					$lte: 4,
				},
				// createdAt: { $lte: limit }, // createdAt <= limit
			},

		}).then((listNotification) => {
			listNotification.forEach((element) => {
				// ( updated_at + retry ^ interval ) <= now
				data = element.updatedAt;
				data = new Date(data.setDate(data.getDate() +
					(Math.ceil((element.numberSent + 1) ** 1.8))));
				console.log(data);
				console.log(`${new Date(Date.now()).toISOString()} `);

				if (data <= Date.now()) {
					console.log(`Sending request notification to user ${element.userID}`);
					console.log(`Time: ${new Date(Date.now())}`);
					User.findOne({
						attributes: ['address', 'session', 'id'],
						where: {
							id: element.userID,
							receiveMessage: {
								$ne: false,
							},
						},
					}).then((userData) => {
						requestWarning(userData, element.missionID);
					}).catch((errUser) => {
						console.log(`Coundn't find User => ${errUser}`);
					});
				}
			});
		}).catch((errMission) => {
			console.log(`Coundn't find Notifications => ${errMission}`);
		});
	}, (() => {
		console.log('Crontab \'timer\' stopped.');
	}),
	true, /* Starts the job right now (no need for MissionTimer.start()) */
	'America/Sao_Paulo',
	false, // context
	// Below: runOnInit = true TODO useful only for tests
	false // eslint-disable-line comma-dangle
);
module.exports.RequestTimer = RequestTimer;


// console.log('\n\nHere');
// date = new Date(Date.now());
// console.log(`${date} `);
// console.log('\n');
// const newDate = new Date(date.setTime(date.getTime() - (element.numberSent * 86400000)));
// console.log(`${newDate} `);
// console.log(`${element.updatedAt} `);
// if (element.updatedAt <= newDate) {
