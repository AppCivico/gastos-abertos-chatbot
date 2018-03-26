/* global bot:true builder:true */

bot.library(require('./information-access-request'));
bot.library(require('./first_mission/conclusion'));
bot.library(require('./first_mission/assign'));
bot.library(require('./second_mission/assign'));
bot.library(require('./second_mission/conclusion'));

const emoji = require('node-emoji');
const retryPrompts = require('../misc/speeches_utils/retry-prompts');
const saveSession = require('../misc/save_session');
const errorLog = require('../misc/send_log');

const User = require('../server/schema/models').user;
const UserMission = require('../server/schema/models').user_mission;

const library = new builder.Library('game');

const Yes = 'Sim';
const No = 'Não';
const Restart = 'Voltar para o início';
const Confirm = 'Por hoje, chega';

let user;
// antigo user_mission, mudou para se encaixar na regra 'camel-case' e UserMission já existia
let missionUser;

library.dialog('/', [
	(session) => {
		User.findOne({
			where: { fb_id: session.userData.userid },
		}).then((UserData) => {
			user = UserData.dataValues;
			UserMission.count({
				where: { user_id: UserData.dataValues.id },
			}).then((count) => {
				if (count === 0) {
					session.replaceDialog(
						'firstMissionAssign:/',
						{
							user,
						} // eslint-disable-line comma-dangle
					);
					// return user;
				}
				session.replaceDialog('/currentMission');
				// return undefined;
			}).catch((err) => {
				errorLog.storeErrorLog(session, `Error finding user or counting Mission => ${err}`, user.id);
				session.send('Ocorreu um erro! Nossos administradores estão sendo avisados e logo eles irão te ajudar.');
				session.replaceDialog('*:/getStarted');
			});
		});
	},
]).cancelAction('cancelAction', '', {
	matches: /^cancel$|^cancelar$|^voltar$|^in[íi]cio$|^começar/i,
});

library.dialog('/currentMission', [
	(session) => {
		saveSession.updateSession(session.userData.userid, session);
		UserMission.findAll({
			where: {
				user_id: user.id,
			},
		}).then((UserMissionData) => {
			missionUser = UserMissionData[UserMissionData.length - 1].dataValues;

			switch (missionUser.mission_id) {
			case 1:
				if (missionUser.completed) {
					session.replaceDialog(
						'secondMissionAssign:/',
						{
							user,
						} // eslint-disable-line comma-dangle
					);
				} else {
					session.replaceDialog(
						'firstMissionConclusion:/',
						{
							user,
							user_mission: missionUser,
						} // eslint-disable-line comma-dangle
					);
				}
				break;
			default: // 2
				if (missionUser.completed) {
					session.send(`Parabéns! Você concluiu o processo de missões do Gastos Abertos! ${emoji.get('tada').repeat(3)}`);
					session.send('Junte-se a nós no Grupo de Lideranças do Gastos Abertos no WhatsApp do Gastos Abertos. ' +
					`Participe dos debates e compartilhe suas experiências conosco. ${emoji.get('slightly_smiling_face').repeat(2)}`);
					session.send('Para entrar, basta acessar o link abaixo do seu celular:' +
					'\n\n https://chat.whatsapp.com/Flm0oYPVLP0KfOKYlUidXS');
					builder.Prompts.choice(
						session,
						'Posso te ajudar com mais alguma coisa?',
						[Restart, Confirm],
						{
							listStyle: builder.ListStyle.button,
							retryPrompt: retryPrompts.choice,
						} // eslint-disable-line comma-dangle
					);
				} else if (missionUser.metadata.request_generated === 0) {
					session.send(`Você está na segunda missão, no entanto, não gerou um pedido de acesso à informação. ${emoji.get('thinking_face').repeat(2)}`);
					session.replaceDialog('/sendToInformationAccessRequest', 	{ user });
				} else {
					session.replaceDialog(
						'secondMissionConclusion:/',
						{
							user,
						} // eslint-disable-line comma-dangle
					);
				}
			}
		}).catch((err) => {
			errorLog.storeErrorLog(session, `Error finding user or counting Mission => ${err}`, user.id);
			session.send('Ocorreu um erro! Nossos administradores estão sendo avisados e logo eles irão te ajudar.');
			session.replaceDialog('*:/getStarted');
		});
	},

	(session, args) => {
		switch (args.response.entity) {
		case Confirm:
			session.send('Então, pararemos por aqui. Agradeçemos sua participação.' +
		'\n\nSe quiser conversar comigo novamente, basta me mandar qualquer mensagem.');
			session.send(`Estarei te esperando. ${emoji.get('relaxed').repeat(2)}`);
			session.endConversation();
			break;
		default: // WelcomeBack
			session.replaceDialog('*:/getStarted');
			break;
		}
	},
]).cancelAction('cancelAction', '', {
	matches: /^cancel$|^cancelar$|^voltar$|^in[íi]cio$|^começar/i,
});

library.dialog('/sendToInformationAccessRequest', [
	(session) => {
		builder.Prompts.choice(
			session,
			'Vamos gerar seu pedido agora?',
			[Yes, No],
			{
				listStyle: builder.ListStyle.button,
				retryPrompt: retryPrompts.choice,
			} // eslint-disable-line comma-dangle
		);
	},

	(session, args) => {
		switch (args.response.entity) {
		case Yes:
			session.replaceDialog(
				'informationAccessRequest:/',
				{
					user,
				} // eslint-disable-line comma-dangle
			);
			break;
		default: // No
			session.send(`Okay! Eu estarei aqui esperando para começarmos! ${emoji.get('wave').repeat(2)}`);
			session.endDialog();
			break;
		}
	},
]).cancelAction('cancelAction', '', {
	matches: /^cancel$|^cancelar$|^voltar$|^in[íi]cio$|^começar/i,
});
module.exports = library;
