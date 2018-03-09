/* global  bot:true builder:true */

const library = new builder.Library('secondMissionAssign');
const emoji = require('node-emoji');

bot.library(require('../information-access-request'));

const UserMission = require('../../server/schema/models').user_mission;

const Yes = 'Sim';
const No = 'Não';
const HappyYes = 'Vamos nessa!';
const NotYet = 'Ainda não';

const retryPrompts = require('../../misc/speeches_utils/retry-prompts');
const texts = require('../../misc/speeches_utils/big-texts');
const custom = require('../../misc/custom_intents');

let user;

library.dialog('/', [
	(session, args) => {
		[user] = [args.user];
		custom.updateSession(session.userData.userid, session);
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
			session.endDialog();
			break;
		}
	},
]).cancelAction('cancelAction', '', {
	matches: /^cancel$|^cancelar$|^voltar$|^in[íi]cio$|^começar/i,
});

library.dialog('/assign', [
	(session, args) => {
		[user] = [args.user];
		custom.updateSession(session.userData.userid, session);
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
			session.send('Vamos nessa!');
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
		});
	},
	(session, args) => {
		switch (args.response.entity) {
		case HappyYes:
			session.beginDialog(
				'informationAccessRequest:/',
				{
					user,
				} // eslint-disable-line comma-dangle
			);
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