/* global builder:true */

/* eslint no-param-reassign: ["error", { "props": true, "ignorePropertyModificationsFor":
["session"] }] */

const Trello = require('trello');

const trello = new Trello(process.env.TRELLO_API_KEY, process.env.TRELLO_USER_TOKEN);
const retryPrompts = require('../misc/speeches_utils/retry-prompts');
const emoji = require('node-emoji');

const library = new builder.Library('contact');

const SignUpProblems = 'Inscrição';
const Informations = 'Informações';
const MissionsInformations = 'Processo de missões';
let TrelloListId = '';
let Subject = '';

library.dialog('/', [
	(session) => {
		session.sendTyping();
		builder.Prompts.choice(
			session,
			`Obrigado por seu interesse. ${emoji.get('slightly_smiling_face').repeat(2)} Mas diga, como posso te ajudar?`,
			[SignUpProblems, Informations, MissionsInformations],
			{
				listStyle: builder.ListStyle.button,
				retryPrompt: retryPrompts.choice,
			} // eslint-disable-line comma-dangle
		);
	},
	(session, result) => {
		session.sendTyping();
		if (result.response) {
			session.beginDialog('validators:email', {
				prompt: `Deixe seu email, a equipe Gastos Abertos entrará em contato. ${emoji.get('postal_horn')}`,
				retryPrompt: retryPrompts.email,
				maxRetries: 10,
			});

			switch (result.response.entity) {
			case SignUpProblems:
				Subject = SignUpProblems;
				break;
			case Informations:
				Subject = Informations;
				break;
			default: // MissionsInformations
				Subject = MissionsInformations;
				break;
			}
		}
	},
	(session, args) => {
		session.sendTyping();
		if (args.resumed) {
			session.send('Você tentou inserir um e-mail inválido muitas vezes. Tente novamente mais tarde.');
			session.endDialogWithResult({ resumed: builder.ResumeReason.notCompleted });
		} else {
			session.dialogData.email = args.response;
			builder.Prompts.text(session, 'Qual é a sua mensagem para nós?');
		}
	},
	(session, args) => {
		session.dialogData.message = args.response;

		if (Subject === SignUpProblems) {
			TrelloListId = process.env.TRELLO_LIST_ID_1;
		}
		if (Subject === Informations) {
			TrelloListId = process.env.TRELLO_LIST_ID_2;
		}
		if (Subject === MissionsInformations) {
			TrelloListId = process.env.TRELLO_LIST_ID_3;
		}

		trello.addCard(
			`e-mail: ${session.dialogData.email}`, session.dialogData.message, TrelloListId,
			(error) => {
				if (error) {
					console.log('Could not add card:', error);
					session.send(`Oooops...Houve um problema ao enviar sua mensagem de contato, tente novamente. ${emoji.get('confounded').repeat(2)}`);
					//	session.endDialogWithResult({ resumed: builder.ResumeReason.notCompleted });
					session.endDialog();
				} else {
					session.send(`Recebemos seu contato com sucesso! Em breve, você receberá uma resposta em seu e-mail! ${emoji.get('thumbsup').repeat(2)}`);
					//		session.endDialogWithResult({ resumed: builder.ResumeReason.completed });
					session.endDialog();
				}
			} // eslint-disable-line comma-dangle
		);
	},
]).cancelAction('cancelAction', '', {
	matches: /^cancel$|^cancelar$|^desisto/i,
});

module.exports = library;
