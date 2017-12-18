/* global  bot:true builder:true */

const library = new builder.Library('secondMissionAssign');

bot.library(require('../information-access-request'));

// const User = require('../../server/schema/models').user;
const UserMission = require('../../server/schema/models').user_mission;

const Yes = 'Sim';
const No = 'Não';
const HappyYes = 'Vamos nessa!';

const retryPrompts = require('../../misc/speeches_utils/retry-prompts');
const texts = require('../../misc/speeches_utils/big-texts');

let user;
// antigo user_mission, mudou para se encaixar na regra 'camel-case' e UserMission já existia
let MissionUser;

library.dialog('/', [
	(session, args) => {
		[user] = [args.user];
		MissionUser = args.user_mission;

		builder.Prompts.choice(
			session,
			'Vamos ver agora nossa segunda missão?',
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
			session.replaceDialog('/assign');
			break;
		default: // No
			session.send('Okay! Eu estarei aqui esperando para começarmos!');
			session.endDialog();
			session.beginDialog('/welcomeBack');
			break;
		}
	},
]).cancelAction('cancelar', null, { matches: /^cancelar/i });

library.dialog('/assign', [
	(session) => {
		UserMission.create({
			user_id: user.id,
			mission_id: 2,
			metadata: { request_generated: 0 },
		})
			// .then((UserMission) => {
			.then(() => {
				session.send('Vamos nessa!');
				session.send(texts.second_mission.assign);
				builder.Prompts.choice(
					session,
					'Vamos gerar nosso pedido de acesso à informação? Eu precisarei te fazer mais algumas perguntas referente ao portal de transparência.',
					[HappyYes, No],
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
					user_mission: MissionUser,
				} // eslint-disable-line comma-dangle
			);
			break;
		default: // No
			session.send('Beleza! Estarei te esperando aqui para seguirmos em frente!');
			session.endDialog();
			session.beginDialog('/welcomeBack');
			break;
		}
	},
]);

module.exports = library;
