/* global  builder:true */

/* eslint no-param-reassign: ["error", { "props": true, "ignorePropertyModificationsFor":
["session"] }] */

const Trello = require('trello');

const trello = new Trello(process.env.TRELLO_API_KEY, process.env.TRELLO_USER_TOKEN);
const retryPrompts = require('../misc/speeches_utils/retry-prompts');

const library = new builder.Library('contact');

const SignUpProblems = 'Inscrição';
const Informations = 'Informações';
const MissionsInformations = 'Processo de missões';
let Subject = '';

library.dialog('/', [
	(session) => {
		session.sendTyping();
		builder.Prompts.choice(
			session,
			'Obrigado por seu interesse. Mas diga, como posso te ajudar?',
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
			switch (result.response.entity) {
			case SignUpProblems:
				session.beginDialog('validators:email', {
					prompt: 'Deixe seu email, a equipe Gastos Abertos entrará em contato.',
					retryPrompt: retryPrompts.email,
					maxRetries: 10,
				});
				Subject = SignUpProblems;
				break;
			case Informations:
				session.beginDialog('validators:email', {
					prompt: 'Deixe seu email, a equipe Gastos Abertos entrará em contato.',
					retryPrompt: retryPrompts.email,
					maxRetries: 10,
				});
				Subject = Informations;
				break;
			default: // MissionsInformations
				session.beginDialog('validators:email', {
					prompt: 'Deixe seu email, a equipe Gastos Abertos entrará em contato.',
					retryPrompt: retryPrompts.email,
					maxRetries: 10,
				});
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
			trello.addCard(
				`e-mail: ${session.dialogData.email}`, session.dialogData.message, process.env.TRELLO_LIST_ID_1,
				(error) => {
					if (error) {
						console.log('Could not add card:', error);
						session.send('Oooops...Houve um problema ao enviar sua mensagem de contato, tente novamente.');
						session.endDialogWithResult({ resumed: builder.ResumeReason.notCompleted });
					} else {
						console.log('Added card:');
						session.send('Recebemos seu contato com sucesso! Em breve você receberá em seu e-mail uma resposta!');
						session.endDialogWithResult({ resumed: builder.ResumeReason.completed });
					}
				} // eslint-disable-line comma-dangle
			);
		}
		if (Subject === Informations) {
			trello.addCard(
				`e-mail: ${session.dialogData.email}`, session.dialogData.message, process.env.TRELLO_LIST_ID_2,
				(error) => {
					if (error) {
						console.log('Could not add card:', error);
						session.send('Oooops...Houve um problema ao enviar sua mensagem de contato, tente novamente.');
						session.endDialogWithResult({ resumed: builder.ResumeReason.notCompleted });
					} else {
						console.log('Added card:');
						session.send('Recebemos seu contato com sucesso! Em breve você receberá em seu e-mail uma resposta!');
						session.endDialogWithResult({ resumed: builder.ResumeReason.completed });
					}
				} // eslint-disable-line comma-dangle
			);
		}
		if (Subject === MissionsInformations) {
			trello.addCard(
				`e-mail: ${session.dialogData.email}`, session.dialogData.message, process.env.TRELLO_LIST_ID_3,
				(error) => {
					if (error) {
						console.log('Could not add card:', error);
						session.send('Oooops...Houve um problema ao enviar sua mensagem de contato, tente novamente.');
						session.endDialogWithResult({ resumed: builder.ResumeReason.notCompleted });
					} else {
						console.log('Added card:');
						session.send('Recebemos seu contato com sucesso! Em breve você receberá em seu e-mail uma resposta!');
						session.endDialogWithResult({ resumed: builder.ResumeReason.completed });
					}
				} // eslint-disable-line comma-dangle
			);
		}
	},
]).cancelAction('cancel', null, { matches: /^cancel/i });

module.exports = library;
