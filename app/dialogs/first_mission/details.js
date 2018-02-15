/* global  bot:true builder:true */

const library = new builder.Library('firstMissionDetails');

bot.library(require('./conclusion'));

const retryPrompts = require('../../misc/speeches_utils/retry-prompts');
const texts = require('../../misc/speeches_utils/big-texts');

const Contact = 'Entrar em contato';
const Restart = 'Voltar para o início';
const Conclusion = 'Concluir a missão';

library.dialog('/', [
	(session) => {
		session.send(texts.first_mission.details);

		builder.Prompts.choice(
			session,
			'Posso te ajudar com mais alguma coisa?',
			[Contact, Restart, Conclusion],
			{
				listStyle: builder.ListStyle.button,
				retryPrompt: retryPrompts.choice,
			} // eslint-disable-line comma-dangle
		);
	},

	(session, args) => {
		switch (args.response.entity) {
		case Contact:
			session.replaceDialog('contact:/');
			break;
		case Restart:
			session.endDialog();
			break;
		default: // Conclusion
			session.beginDialog('firstMissionConclusion:/');
		}
	},
]).cancelAction('cancelAction', '', {
	matches: /^cancel$|^cancelar$|^voltar$|^in[íi]cio$|^começar/i,

});

module.exports = library;
