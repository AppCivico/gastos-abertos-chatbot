/* global  bot:true builder:true */

const library = new builder.Library('firstMissionAssign');

bot.library(require('../contact'));
bot.library(require('./conclusion'));
bot.library(require('./details'));

const retryPrompts = require('../../misc/speeches_utils/retry-prompts');
const texts = require('../../misc/speeches_utils/big-texts');

const User = require('../../server/schema/models').user;
const UserMission = require('../../server/schema/models').user_mission;
const emoji = require('node-emoji');

const MoreInformations = 'Mais detalhes';
const Conclusion = 'Conclusão da missão';
const Contact = 'Entrar em contato';
const Restart = 'Voltar para o início';
const Yes = 'Sim';
const No = 'Não';

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
				session.send(`Vamos lá! Que comece o processo de missões! ${emoji.get('sign_of_the_horns').repeat(2)}`);
				session.beginDialog('/moreDetails');
			})
			.catch((err) => {
				console.log(`Error creating user mission${err}`);
				session.send('Oooops, tive um problema ao iniciar suas missões, tente novamente mais tarde ou entre em contato conosco.' +
				` ${emoji.get('dizzy_face').repeat(3)}`);
				session.endDialogWithResult({ resumed: builder.ResumeReason.notCompleted });
				throw err;
			});
	},
]).cancelAction('cancelAction', '', {
	matches: /^cancel$|^cancelar$|^desisto/i,
});

library.dialog('/promptButtons', [
	(session) => {
		builder.Prompts.choice(
			session,
			'Posso te ajudar com mais alguma coisa?',
			[Conclusion, MoreInformations, Contact, Restart],
			{
				listStyle: builder.ListStyle.button,
				retryPrompt: retryPrompts.choice,
			} // eslint-disable-line comma-dangle
		);
	},
	(session, args) => {
		switch (args.response.entity) {
		case MoreInformations:
			session.replaceDialog('/moreDetails');
			break;
		case Contact:
			session.beginDialog('contact:/');
			break;
		case Restart:
			session.endDialog();
			break;
		default: // Conclusion
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
]).cancelAction('cancelAction', '', {
	matches: /^cancel$|^cancelar$|^desisto/i,
});

library.dialog('/moreDetails', [
	(session) => {
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
	},
	(session, args) => {
		switch (args.response.entity) {
		case Yes:
			session.send(texts.first_mission.reference_transparency_portals);
			break;
		default: // No
			session.send('Ok! Mas qualquer dúvida pode entrar em contato com a gente aqui do Gastos Abertos, tá?' +
			` ${emoji.get('slightly_smiling_face').repeat(2)}`);
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
		session.replaceDialog('/promptButtons');
	},
]).cancelAction('cancelAction', '', {
	matches: /^cancel$|^cancelar$|^desisto/i,
});

module.exports = library;
