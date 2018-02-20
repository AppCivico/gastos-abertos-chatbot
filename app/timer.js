/* global bot:true builder:true */
// A class for adding a timer to the missions and sending warning messages

const UserMission = require('./server/schema/models').user_mission;
const User = require('./server/schema/models').user;

let executedAlready = false;
// const limit = (60 * 60 * 1000) * 5;

function sendWarning(address) {
	const msg = new builder.Message().address(address);
	executedAlready = true;
	msg.textLocale('pt-BR');
	msg.text('Percebemos que você não terminou um de nossos processos.\n\nSe precisar de ajuda, entre em contato conosco. :)');
	bot.send(msg);
	// bot.beginDialog(address, session);
}

const timer = (missionId) => {
	UserMission.findOne({
		attributes: ['createdAt', 'updatedAt', 'completed', 'user_id'],
		where: { id: missionId },
	}).then((misionData) => {
		if (misionData.completed === false) {
			User.findOne({
				attributes: ['address', 'session'],
				where: { id: misionData.user_id },
			}).then((userData) => {
				sendWarning(userData.address);
			}).catch(() => {
				console.log('Coundn\'t find User');
			});
		}
	}).catch(() => {
		console.log('Coundn\'t find UserMission');
	});
};

module.exports.timer = timer;
