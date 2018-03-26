/* global  bot:true builder:true */

const emoji = require('node-emoji');

const library = new builder.Library('secondMissionAssign');

bot.library(require('../information-access-request'));

const retryPrompts = require('../../misc/speeches_utils/retry-prompts');
const texts = require('../../misc/speeches_utils/big-texts');
const saveSession = require('../../misc/save_session');
const errorLog = require('../../misc/send_log');

const UserMission = require('../../server/schema/models').user_mission;
const User = require('../../server/schema/models').user;

const Yes = 'Sim';
const No = 'Não';
const HappyYes = 'Vamos nessa!';
const NotYet = 'Ainda não';
let user;

library.dialog('/', [
	(session, args) => {
		[user] = [args.user];
		saveSession.updateSession(session.userData.userid, session);
		builder.Prompts.choice(
			session,
			'Agora, vamos ver nossa segunda missão?',
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
			session.replaceDialog('/assign', { user });
			break;
		default: // No
			session.send(`Beleza! Estarei aqui te esperando para seguirmos em frente! ${emoji.get('thumbsup').repeat(2)}`);
			session.replaceDialog('*:/getStarted');
			break;
		}
	},
]).cancelAction('cancelAction', '', {
	matches: /^cancel$|^cancelar$|^voltar$|^in[íi]cio$|^começar/i,
});

library.dialog('/assign', [
	(session) => {
		saveSession.updateSession(session.userData.userid, session);

		User.findOne({
			where: { fb_id: session.userData.userid },
		}).then((UserData) => {
			user = UserData.dataValues;

			UserMission.findOrCreate({
				where: { // checks if exists
					user_id: user.id,
					mission_id: 2,
				},
				defaults: {
					user_id: user.id,
					mission_id: 2,
					metadata: { request_generated: 0 },
				},
			}).then(() => {
				session.send(texts.second_mission.assign);
				builder.Prompts.choice(
					session,
					'Vamos gerar nosso pedido de acesso à informação? Eu precisarei te fazer mais algumas perguntas referente ao portal de transparência.',
					[HappyYes, NotYet],
					{
						listStyle: builder.ListStyle.button,
						retryPrompt: retryPrompts.choice,
					} // eslint-disable-line comma-dangle
				);
			}).catch((err) => {
				errorLog.storeErrorLog(session, `Error finding or creating userMission => ${err}`);
				session.send(`Para a segunda missão, nós vamos gerar um pedido de acesso a informação. ${emoji.get('grinning').repeat(2)}`);
				session.replaceDialog('informationAccessRequest:/');
			});
		}).catch((err) => {
			errorLog.storeErrorLog(session, `Error finding user => ${err}`);
			session.send(`Tive um problema ao iniciar suas missões. ${emoji.get('dizzy_face').repeat(2)}. ` +
			'Estarei tentando resolver o problema. Tente novamente mais tarde.');
			session.replaceDialog('*:/getStarted');
		});
	},
	(session, args) => {
		switch (args.response.entity) {
		case HappyYes:
			session.replaceDialog('informationAccessRequest:/');
			break;
		default: // NotYet
			session.send(`Beleza! Estarei aqui te esperando para seguirmos em frente! ${emoji.get('thumbsup').repeat(2)}`);
			session.replaceDialog('*:/getStarted');
			break;
		}
	},
]).cancelAction('cancelAction', '', {
	matches: /^cancel$|^cancelar$|^voltar$|^in[íi]cio$|^começar/i,
});

module.exports = library;
