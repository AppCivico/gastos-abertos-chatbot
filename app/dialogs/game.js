/* global  bot:true */

bot.library(require('./contact'));
bot.library(require('./information-access-request'));
bot.library(require('./first_mission/conclusion'));
bot.library(require('./first_mission/assign'));
bot.library(require('./second_mission/assign'));
bot.library(require('./second_mission/conclusion'));


const builder = require('botbuilder');

const retryPrompts = require('../misc/speeches_utils/retry-prompts');

const User = require('../server/schema/models').user;
const UserMission = require('../server/schema/models').user_mission;

const library = new builder.Library('game');

const Yes = 'Sim';
const No = 'Não';

let email = '';
let user;
// antigo user_mission, mudou para se encaixar na regra 'camel-case' e UserMission já existia
let missionUser;

// TODO mudanças provisórias para teste
// const dateFns = require('date-fns');
// const firstMissionCompleteMinDate = dateFns.format(new Date(2017, 8, 19), 'MM/DD/YYYY');
// const today = dateFns.format(new Date(), 'MM/DD/YYYY');

library.dialog('/', [
	(session) => {
		session.sendTyping();
		session.beginDialog('validators:email', {
			prompt: 'Qual é o e-mail que você utilizou para se cadastrar como líder?',
			retryPrompt: retryPrompts.email,
			maxRetries: 10,
		});
	},
	(session, args) => {
		if (args.resumed) {
			session.sendTyping();
			session.send('Você tentou inserir um e-mail inválido muitas vezes. Tente novamente mais tarde.');
			session.endDialogWithResult({ resumed: builder.ResumeReason.notCompleted });
			return;
		}

		email = args.response;
		session.sendTyping();

		User.count({
			where: {
				email,
			},
		})
			.then((count) => {
				if (count !== 0) {
					session.sendTyping();
					session.replaceDialog('/missionStatus');
					return email;
				}
				session.sendTyping();
				session.send('Hmmm...Não consegui encontrar seu cadastro. Tente novamente.');
				session.endDialog();
				session.beginDialog('/welcomeBack');
				return undefined;
			});
	},
]).cancelAction('cancelar', null, { matches: /^cancelar/i });

library.dialog('/missionStatus', [
	(session) => {
		/*
						Verifica se o usuário está ativo, aprovado e se possui alguma entrada na
						tabela 'user_mission'. Caso ele não tenha nenhuma entrada, está aprovado mas está
						inativo. Devo então iniciar o processo da primeira missão
				*/
	//	if (session.message.address.channelId === 'facebook') {
	//		const fbId = session.message.sourceEvent.sender.id;
		if (1 === 1) {
			const fbId = '100004770631443';

			// jordan@teste.com
			User.findOne({
				where: {
					email,
					fb_id: fbId,
				},
			}).then((UserData) => {
				user = UserData.dataValues;
				UserMission.count({
					where: {
						user_id: user.id,
					},
				})
					.then((count) => {
						//		if (count === 0 && !user.active && user.approved) {
						if (1 === 1) {
							session.beginDialog(
								'firstMissionAssign:/',
								{
									user,
									user_mission: missionUser,
								} // eslint-disable-line comma-dangle
							);
							return user;
						}
						session.replaceDialog('/currentMission');
						return undefined;
					});
			});
		} else {
			User.findOne({
				where: {
					email,
				},
			}).then((UserData) => {
				user = UserData.dataValues;

				UserMission.count({
					where: {
						user_id: user.id,
					},
				})
					.then((count) => {
						if (count === 0 && !user.active && user.approved) {
							session.beginDialog(
								'firstMissionAssign:/',
								{
									user,
									user_mission: missionUser,
								} // eslint-disable-line comma-dangle
							);
							return user;
						}
						session.replaceDialog('/currentMission');
						return undefined;
					});
			});
		}
	},
]).cancelAction('cancelar', null, { matches: /^cancelar/i });

library.dialog('/currentMission', [
	(session) => {
		UserMission.findAll({
			where: {
				user_id: user.id,
			},
		})
			.then((UserMissionData) => {
				missionUser = UserMissionData[UserMission.length - 1].dataValues;

				switch (missionUser.mission_id) {
				case 1:
					if (missionUser.completed) {
						session.beginDialog(
							'secondMissionAssign:/',
							{
								user,
								user_mission: missionUser,
							} // eslint-disable-line comma-dangle
						);
					} else {
						session.beginDialog(
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
						session.send('Parabéns! Você concluiu o processo de missões do Gastos Abertos!');
						session.send('Caso você não participe ainda, junte-se a nós no grupo do WhatsApp do Gastos Abertos! Lá temos bastante discussões legais e ajudamos com tudo que conseguimos!');
						session.send('Basta clicar no link a seguir: https://chat.whatsapp.com/Flm0oYPVLP0KfOKYlUidXS');
						session.endDialog();
						session.beginDialog('/welcomeBack');
					} else if (missionUser.metadata.request_generated === 0) {
						session.send('Você está na segunda missão, no entanto não gerou um pedido de acesso à informação.');
						session.replaceDialog('/sendToInformationAccessRequest');
					} else {
						session.beginDialog(
							'secondMissionConclusion:/',
							{
								user,
								user_mission: missionUser,
							} // eslint-disable-line comma-dangle
						);
					}
				}
			});
	},
]).cancelAction('cancelar', null, { matches: /^cancelar/i });

library.dialog('/sendToInformationAccessRequest', [
	(session) => {
		builder.Prompts.choice(
			session,
			'Vamos gerar seu pedido?',
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
			session.beginDialog(
				'informationAccessRequest:/',
				{
					user,
					user_mission: missionUser,
				} // eslint-disable-line comma-dangle
			);
			break;
		default: // No
			session.send('Okay! Eu estarei aqui esperando para começarmos!');
			session.endDialog();
			session.replaceDialog('/welcomeBack');
			break;
		}
	},
]);

module.exports = library;
