/* global  bot:true builder:true */

const library = new builder.Library('firstMissionAssign');

bot.library(require('../contact'));
bot.library(require('./conclusion'));

const retryPrompts = require('../../misc/speeches_utils/retry-prompts');
const texts = require('../../misc/speeches_utils/big-texts');
const custom = require('../../misc/custom_intents');

const UserMission = require('../../server/schema/models').user_mission;
const emoji = require('node-emoji');

const Yes = 'Sim';
const No = 'Não';

let user;
// antigo user_mission, mudou para se encaixar na regra 'camel-case' e UserMission já existia
let missionUser;

library.dialog('/', [
	(session, args) => {
		custom.updateSession(session.userData.userid, session);
		[user] = [args.user];
		missionUser = args.user_mission;
		UserMission.create({
			user_id: user.id,
			mission_id: 1,
		}).then(() => {
			session.send(`Vamos lá! Que comece o processo de missões! ${emoji.get('sign_of_the_horns').repeat(2)}`);
			session.beginDialog('/moreDetails');
		}).catch((err) => {
			console.log(`Error creating user mission: ${err}`);
			session.send('Oooops, tive um problema ao iniciar suas missões, tente novamente mais tarde ou entre em contato conosco.' +
				` ${emoji.get('dizzy_face').repeat(3)}`);
			session.endDialogWithResult({ resumed: builder.ResumeReason.notCompleted });
			throw err;
		});
	},
]).cancelAction('cancelAction', '', {
	matches: /^cancel$|^cancelar$|^voltar$|^in[íi]cio$|^começar/i,
});

library.dialog('/moreDetails', [
	(session) => {
		custom.updateSession(session.userData.userid, session);
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
		session.beginDialog(
			'firstMissionConclusion:/transparencyPortalExists',
			{
				user,
				user_mission: missionUser,
			} // eslint-disable-line comma-dangle
		);
	},
]).cancelAction('cancelAction', '', {
	matches: /^cancel$|^cancelar$|^voltar$|^in[íi]cio$|^começar/i,
});

module.exports = library;
