/* global bot:true builder:true */

bot.library(require('./contact'));
bot.library(require('./information-access-request'));
bot.library(require('./first_mission/conclusion'));
bot.library(require('./first_mission/assign'));
bot.library(require('./second_mission/assign'));
bot.library(require('./second_mission/conclusion'));

const emoji = require('node-emoji');
const retryPrompts = require('../misc/speeches_utils/retry-prompts');

// const User = require('../server/schema/models').user;
const UserMission = require('../server/schema/models').user_mission;

const library = new builder.Library('game2');

const Yes = 'Sim';
const No = 'Não';
const Contact = 'Entrar em contato';
const Restart = 'Voltar para o início';
const Confirm = 'Por hoje, chega';
// Esse é o novo!
let user;
// antigo user_mission, mudou para se encaixar na regra 'camel-case' e UserMission já existia
let missionUser;

library.dialog('/', [
	(session, args) => {
		[User] = [args.User];
		session.send(`Vamos começar o processo de missões. ${emoji.get('slightly_smiling_face').repeat(2)}`);
		User.findOne({
			where: { fb_id: session.userData.userid },
		}).then((UserData) => {
			UserMission.count({
				where: { user_id: UserData.dataValues.id },
			}).then((count) => {
				if (count === 0) {
					session.send('Primeira missão');
					session.beginDialog(
						'firstMissionAssign:/',
						{
							user: UserData.dataValues,
						} // eslint-disable-line comma-dangle
					);
				} else {
					// session.replaceDialog('/currentMission');
					session.send('Outra missão missão');
				}
			});
		});
	},

]).cancelAction('cancelAction', '', {
	matches: /^cancel$|^cancelar$|^voltar$|^in[íi]cio$|^desisto/i,
});


module.exports = library;
