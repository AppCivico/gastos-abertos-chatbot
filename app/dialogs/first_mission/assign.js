/* global  bot:true builder:true */

const library = new builder.Library('firstMissionAssign');

bot.library(require('./conclusion'));

const retryPrompts = require('../../misc/speeches_utils/retry-prompts');
const texts = require('../../misc/speeches_utils/big-texts');
const custom = require('../../misc/custom_intents');
const emoji = require('node-emoji');

const User = require('../../server/schema/models').user;
const UserMission = require('../../server/schema/models').user_mission;
const Notification = require('../../server/schema/models').notification;


const Yes = 'Sim';
const No = 'Não';

let user;
// antigo user_mission, mudou para se encaixar na regra 'camel-case' e UserMission já existia
let missionUser;

let userCity;
let userState;

library.dialog('/', [
	(session, args) => {
		custom.updateSession(session.userData.userid, session);
		[user] = [args.user];
		missionUser = args.user_mission;
		UserMission.create({
			user_id: user.id,
			mission_id: 1,
		}).then((missionData) => {
			Notification.create({
				// this is 'mission id' as in 'type of mission'
				missionID: 1,
				userID: missionData.dataValues.user_id,
				msgSent: 'Percebemos que você não terminou a avaliação do portal de transparência do seu município. ' +
				'\n\nSe precisar de ajuda, entre em contato conosco. :)',
			}).then(() => {
				console.log('Added a new notification to be sent!');
			}).catch((errNotification) => {
				console.log(`Couldn't save notification :( -> ${errNotification})`);
			});
			session.send(`Vamos lá! Que comece o processo de missões! ${emoji.get('sign_of_the_horns').repeat(2)}`);
			session.send(texts.first_mission.details);
			session.beginDialog('/askState');
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

library.dialog('/askState', [
	(session) => {
		custom.updateSession(session.userData.userid, session);
		session.sendTyping();
		session.beginDialog('validators:state', {
			prompt: `Qual é o estado(sigla) que você mora? ${emoji.get('flag-br')}`,
			retryPrompt: retryPrompts.state,
			maxRetries: 10,
		});
	},

	(session, args) => {
		userState = args.response;
		session.replaceDialog('/askCity');
	},
]);

library.dialog('/askCity', [
	(session, args) => {
		custom.updateSessionData(session.userData.userid, session, userState);
		if (!userState) {
			console.log('no user state');
			userState = args.usefulData;
		}
		session.sendTyping();
		builder.Prompts.text(session, `Qual é o município que você representará? ${emoji.get('cityscape')}`);
	},

	(session, args) => {
		userCity = args.response;
		User.update({
			state: userState.toUpperCase(),
			city: userCity,
		}, {
			where: {
				fb_id: session.userData.userid,
			},
			returning: true,
		})
			.then(() => {
				console.log('User address updated sucessfuly');
			})
			.catch((err) => {
				console.log(err);
			});
		session.replaceDialog('/moreDetails');
	},
]);

library.dialog('/moreDetails', [
	(session) => {
		custom.updateSession(session.userData.userid, session);
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
