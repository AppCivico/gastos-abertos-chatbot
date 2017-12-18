/* global  bot:true builder:true */

const library = new builder.Library('firstMissionAssign');

bot.library(require('../contact'));
bot.library(require('./conclusion'));
bot.library(require('./details'));

const User = require('../../server/schema/models').user;
const UserMission = require('../../server/schema/models').user_mission;

const MoreInformations = 'Mais detalhes';
const Conclusion = 'Conclusão da missão';
const Contact = 'Entrar em contato';
const Restart = 'Ir para o início';
const Yes = 'Sim';
const No = 'Não';

const retryPrompts = require('../../misc/speeches_utils/retry-prompts');
const texts = require('../../misc/speeches_utils/big-texts');

let user;
// antigo user_mission, mudou para se encaixar na regra 'camel-case' e UserMission já existia
let missionUser;

library.dialog('/', [
	(session, args) => {
		[user] = [args.user];
		missionUser = args.user_mission;
		console.log('imprimindo');
		console.log(missionUser);
		if (session.message.address.channelId === 'facebook') {
			User.update({
				fb_id: session.message.sourceEvent.sender.id,
			}, {
				where: {
					id: user.id,
				},
				returning: true,
			})
				.then(() => {
					console.log('User updated sucessfuly');
				})
				.catch((err) => {
					console.log(err);
					throw err;
				});
		}

		UserMission.create({
			user_id: user.id,
			mission_id: 1,
		})
			.then(() => {
				session.send('Vamos lá! Que comece o processo de missões!');
				session.send(texts.first_mission.assign);

				builder.Prompts.choice(
					session,
					'Quer o link para alguns portais de transparência para usar como referência?',
					[Yes, No],
					{
						listStyle: builder.ListStyle.button,
						retryPrompt: retryPrompts.choice,
					} // eslint-disable-line comma-dangle
				);
			})
			.catch((err) => {
				console.log(`Error creating user mission${err}`);
				session.send('Oooops, tive um problema ao iniciar suas missões, tente novamente mais tarde e entre em contato conosco.');
				session.endDialogWithResult({ resumed: builder.ResumeReason.notCompleted });
				throw err;
			});
	},
	(session, args) => {
		switch (args.response.entity) {
		case Yes:
			session.send(texts.first_mission.reference_transparency_portals);
			break;
		default: // No
			session.send('Okay! Mas qualquer dúvida pode entrar em contato com a gente aqui do Gastos Abertos tá?');
			break;
		}

		builder.Prompts.choice(
			session,
			'Quer ver quais serão os pontos sobre os quais eu farei perguntas sobre o portal de transparência?',
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
			session.send(texts.first_mission.questions);
			break;
		default: // No
			session.send('Beleza!');
			break;
		}

		builder.Prompts.choice(
			session,
			'Posso te ajudar com mais alguma coisa?',
			[MoreInformations, Conclusion, Contact, Restart],
			{
				listStyle: builder.ListStyle.button,
				retryPrompt: retryPrompts.choice,
			} // eslint-disable-line comma-dangle
		);
	},

	(session, args) => {
		switch (args.response.entity) {
		case MoreInformations:
			session.send(texts.first_mission.details);

			builder.Prompts.choice(
				session,
				'Quer o link para alguns portais de transparência para usar como referência?',
				[Yes, No],
				{
					listStyle: builder.ListStyle.button,
					retryPrompt: retryPrompts.choice,
				} // eslint-disable-line comma-dangle
			);
			break;
		case Contact:
			session.beginDialog('contact:/');
			break;
		case Restart:
			session.endDialog();
			session.beginDialog('/welcomeBack');
			break;
		default:// Conclusion
			session.endDialog();
			session.beginDialog(
				'firstMissionConclusion:/',
				{
					user,
					user_mission: missionUser,
				} // eslint-disable-line comma-dangle
			);
			break;
		}
	},

	(session, args) => {
		switch (args.response.entity) {
		case Yes:
			session.send(texts.first_mission.reference_transparency_portals);
			break;
		default: // No
			session.send('Okay! Mas qualquer dúvida pode entrar em contato com a gente aqui do Gastos Abertos tá?');
			break;
		}

		builder.Prompts.choice(
			session,
			'Quer ver quais serão os pontos sobre os quais eu farei perguntas sobre o portal de transparência?',
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
			session.send(texts.first_mission.questions);
			break;
		default: // No
			session.send('Beleza!');
			break;
		}

		builder.Prompts.choice(
			session,
			'Posso te ajudar com mais alguma coisa?',
			[MoreInformations, Conclusion, Contact, Restart],
			{
				listStyle: builder.ListStyle.button,
				retryPrompt: retryPrompts.choice,
			} // eslint-disable-line comma-dangle
		);
	},

	(session, args) => {
		switch (args.response.entity) {
		case MoreInformations:
			session.send(texts.first_mission.details);

			builder.Prompts.choice(
				session,
				'Quer o link para alguns portais de transparência para usar como referência?',
				[Yes, No],
				{
					listStyle: builder.ListStyle.button,
					retryPrompt: retryPrompts.choice,
				} // eslint-disable-line comma-dangle
			);
			break;
		case Contact:
			session.beginDialog('contact:/');
			break;
		case Restart:
			session.endDialog();
			session.beginDialog('/welcomeBack');
			break;
		default: // Conclusion
			session.endDialog();
			session.beginDialog(
				'firstMissionConclusion:/',
				{
					user,
					user_mission: missionUser,
				} // eslint-disable-line comma-dangle
			);
			break;
		}
	},
]).cancelAction('cancelar', null, { matches: /^cancelar/i });

module.exports = library;
