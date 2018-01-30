/* global builder:true */
/* eslint no-param-reassign: ["error", { "props": true, "ignorePropertyModificationsFor":
["session"] }] */

const library = new builder.Library('firstMissionConclusion');

const answers = [
	'transparencyPortalExists',
	'transparencyPortalURL',
	'transparencyPortalHasFinancialData',
	'transparencyPortalAllowsFinancialDataDownload',
	'transparencyPortalFinancialDataFormats',
	'transparencyPortalHasContractsData',
	'transparencyPortalHasBiddingsData',
	'transparencyPortalHasBiddingProcessData',
];

const retryPrompts = require('../../misc/speeches_utils/retry-prompts');
const texts = require('../../misc/speeches_utils/big-texts');
const emoji = require('node-emoji');

const User = require('../../server/schema/models').user;
const UserMission = require('../../server/schema/models').user_mission;

const Yes = 'Sim';
const No = 'Não';
const MoreInformations = 'Detalhes da missão';
const Confirm = 'Beleza!';
const WelcomeBack = 'Voltar para o início';

let user;
// antigo user_mission, mudou para se encaixar na regra 'camel-case' e UserMission já existia
// let missionUser;

library.dialog('/', [
	(session, args) => {
		[user] = [args.user];
		//		missionUser = args.user_mission;

		session.sendTyping();
		builder.Prompts.choice(
			session,
			'Pelo o que vi aqui você está na primeira missão, vamos concluí-la?',
			[Yes, No, MoreInformations],
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
			case Yes:
				session.beginDialog('/transparencyPortalExists');
				break;
			case No:
				session.send(`Okay! Estarei te esperando para mandarmos ver nessa tarefa! ${emoji.get('sunglasses')}`);
				session.endDialog();
				break;
			default: // MoreInformations
				session.send(texts.first_mission.details);
				session.beginDialog('/conclusionPromptAfterMoreDetails');
				break;
			}
		}
	},
]).cancelAction('cancelAction', '', {
	matches: /^cancel$|^cancelar$|^voltar$|^in[íi]cio$|^desisto/i,
});

library.dialog('/conclusionPromptAfterMoreDetails', [
	(session) => {
		session.sendTyping();
		builder.Prompts.choice(
			session,
			`Vamos concluir nossa primeira missão juntos? ${emoji.get('slightly_smiling_face')}`,
			[Yes, No],
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
			case Yes:
				session.replaceDialog('/transparencyPortalExists');
				break;
			default: // No
				session.send(`Okay! Estarei te esperando para mandarmos ver nessa tarefa! ${emoji.get('sunglasses')}`);
				session.endDialog();
				break;
			}
		}
	},
]).cancelAction('cancelAction', '', {
	matches: /^cancel$|^cancelar$|^voltar$|^in[íi]cio$|^desisto/i,
});

library.dialog('/transparencyPortalExists', [
	(session) => {
		session.sendTyping();
		session.send("Caso você queira deixar para outra hora, basta digitar 'cancelar' e eu te levarei para o início.");
		builder.Prompts.choice(
			session,
			'Há um portal para transparência orçamentária na cidade, mantido oficialmente pela prefeitura? ',
			[Yes, No],
			{
				listStyle: builder.ListStyle.button,
				retryPrompt: retryPrompts.choice,
			} // eslint-disable-line comma-dangle
		);
	},

	(session, args) => {
		session.sendTyping();
		if (args.response) {
			switch (args.response.entity) {
			case Yes:
				answers.transparencyPortalExists = 1;
				session.replaceDialog('/transparencyPortalURL');
				break;
			default: // No
				answers.transparencyPortalExists = 0;

				// Neste caso o fluxo de conclusão se finaliza pois as próximas perguntas não farão sentido
				session.replaceDialog('/userUpdate');
				break;
			}
		}
	},

	(session, args) => {
		session.dialogData.transparencyPortalURL = args.response;

		session.sendTyping();
		builder.Prompts.choice(
			session,
			'Há dados sobre a execução orçamentária disponível no portal de transparência? ',
			[Yes, No],
			{
				listStyle: builder.ListStyle.button,
				retryPrompt: retryPrompts.choice,
			} // eslint-disable-line comma-dangle
		);
	},

	(session, args) => {
		session.sendTyping();
		if (args.response) {
			switch (args.response.entity) {
			case Yes:
				session.dialogData.transparencyPortalHasFinancialData = 1;
				builder.Prompts.choice(
					session,
					'É possível realizar download dos dados orçamentários? ',
					[Yes, No],
					{
						listStyle: builder.ListStyle.button,
						retryPrompt: retryPrompts.choice,
					} // eslint-disable-line comma-dangle
				);
				switch (args.response.entity) {
				case Yes:
					session.send('yea');
					break;
				default: // No
					session.send('nope');
					break;
				}
				break;
			default: // No
				session.dialogData.transparencyPortalHasFinancialData = 0;
				builder.Prompts.choice(
					session,
					'Os contratos assinados com a prefeitura estão disponíveis no portal de transparência? ',
					[Yes, No],
					{
						listStyle: builder.ListStyle.button,
						retryPrompt: retryPrompts.choice,
					} // eslint-disable-line comma-dangle
				);
				break;
			}
		}
	},
]).cancelAction('cancelAction', '', {
	matches: /^cancel$|^cancelar$|^voltar$|^in[íi]cio$|^desisto/i,
});

library.dialog('/transparencyPortalURL', [
	(session) => {
		session.sendTyping();
		builder.Prompts.text(session, 'Qual é a URL(link) do portal?\n\nExemplo de uma URL: https://gastosabertos.org/');
	},

	(session, args) => {
		answers.transparencyPortalURL = args.response;
		session.replaceDialog('/transparencyPortalHasFinancialData');
	},
]).cancelAction('cancelAction', '', {
	matches: /^cancel$|^cancelar$|^voltar$|^in[íi]cio$|^desisto/i,

});

library.dialog('/transparencyPortalHasFinancialData', [
	(session) => {
		session.sendTyping();
		builder.Prompts.choice(
			session,
			'Há dados sobre a execução orçamentária disponível no portal de transparência? ',
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
			answers.transparencyPortalHasFinancialData = 1;
			session.replaceDialog('/transparencyPortalAllowsFinancialDataDownload');
			break;
		default: // No
			answers.transparencyPortalHasFinancialData = 0;
			session.replaceDialog('/transparencyPortalHasContractsData');
			break;
		}
	},
]).cancelAction('cancelAction', '', {
	matches: /^cancel$|^cancelar$|^voltar$|^in[íi]cio$|^desisto/i,
});

library.dialog('/transparencyPortalAllowsFinancialDataDownload', [
	(session) => {
		session.sendTyping();
		builder.Prompts.choice(
			session,
			'É possível realizar download dos dados orçamentários? ',
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
			answers.transparencyPortalAllowsFinancialDataDownload = 1;
			session.replaceDialog('/transparencyPortalFinancialDataFormats');
			break;
		default: // No
			answers.transparencyPortalAllowsFinancialDataDownload = 0;
			session.replaceDialog('/transparencyPortalHasContractsData');
			break;
		}
	},
]).cancelAction('cancelAction', '', {
	matches: /^cancel$|^cancelar$|^voltar$|^in[íi]cio$|^desisto/i,

});

library.dialog('/transparencyPortalFinancialDataFormats', [
	(session) => {
		session.sendTyping();
		builder.Prompts.text(session, 'Você saberia dizer, qual o formato que estes arquivos estão ? Ex.: CSV, XLS, XML.' +
	`\n\n Se não souber, basta digitar 'Não sei'. ${emoji.get('slightly_smiling_face')}`);
	},
	(session, args) => {
		answers.transparencyPortalFinancialDataFormats = args.response;
		session.replaceDialog('/transparencyPortalHasContractsData');
	},
]).cancelAction('cancelAction', '', {
	matches: /^cancel$|^cancelar$|^voltar$|^in[íi]cio$|^desisto/i,
});

library.dialog('/transparencyPortalHasContractsData', [
	(session) => {
		session.sendTyping();
		builder.Prompts.choice(
			session,
			'Os contratos assinados com a prefeitura estão disponíveis no portal de transparência? ',
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
			answers.transparencyPortalHasContractsData = 1;
			break;
		default: // No
			answers.transparencyPortalHasContractsData = 0;
			break;
		}
		session.replaceDialog('/transparencyPortalHasBiddingsData');
	},
]).cancelAction('cancelAction', '', {
	matches: /^cancel$|^cancelar$|^voltar$|^in[íi]cio$|^desisto/i,
});

library.dialog('/transparencyPortalHasBiddingsData', [
	(session) => {
		session.sendTyping();
		builder.Prompts.choice(
			session,
			'As licitações são divulgadas no portal de transparência da cidade? ',
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
			answers.transparencyPortalHasBiddingsData = 1;
			break;
		default: // No
			answers.transparencyPortalHasBiddingsData = 0;
			break;
		}
		session.replaceDialog('/transparencyPortalHasBiddingProcessData');
	},
]).cancelAction('cancelAction', '', {
	matches: /^cancel$|^cancelar$|^voltar$|^in[íi]cio$|^desisto/i,
});

library.dialog('/transparencyPortalHasBiddingProcessData', [
	(session) => {
		session.sendTyping();
		builder.Prompts.choice(
			session,
			'É possível acompanhar o status do processo licitatório pelo portal de transparência? ',
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
			answers.transparencyPortalHasBiddingProcessData = 1;
			break;
		default: // No
			answers.transparencyPortalHasBiddingProcessData = 0;
			break;
		}
		session.replaceDialog('/userUpdate');
	},
]).cancelAction('cancelAction', '', {
	matches: /^cancel$|^cancelar$|^voltar$|^in[íi]cio$|^desisto/i,
});

library.dialog('/userUpdate', [
	(session) => {
		const msg = new builder.Message(session);
		msg.sourceEvent({
			facebook: {
				attachment: {
					type: 'template',
					payload: {
						template_type: 'generic',
						elements: [{
							title: 'Olá! Eu sou o Guaxi!',
							subtitle: 'O chatbot mais transparente e engajado da internet! Venha conversar comigo!',
							image_url: 'https://gallery.mailchimp.com/cdabeff22c56cd4bd6072bf29/images/8e84d7d3-bba7-43be-acac-733dd6712f78.png',
							item_url: 'http://m.me/gastosabertos',
							buttons: [{
								type: 'element_share',
							}],
						}],
					},
				},
			},
		});

		session.send('Uhuuu! Concluímos nossa primeira missão! ' +
			`\n\nEu disse que formariamos uma boa equipe! ${emoji.get('sunglasses')} ${emoji.get('clap').repeat(3)}`);

		User.count({
			where: {
				state: user.state,
			},
		})
			.then((count) => {
				if (count < 10 && count !== 1) {
					session.send(`E eu vou te dar uma tarefa extra ${emoji.get('grinning')} ${emoji.get('sunglasses')}` +
					`\n\nAtualmente há ${count} líderes no seu estado. Vamos aumentar este número para 10 líderes?`);
					session.send('Para alcançar esse número pedimos que você convide seus amigos para participar desse nosso segundo ciclo do Gastos Abertos!');
					if (session.message.address.channelId === 'facebook') {
						session.send(msg);
					}
				} else if (count < 10 && count === 1) {
					session.send(`E eu vou te dar uma tarefa extra ${emoji.get('grinning')} ${emoji.get('sunglasses')}` +
					'\n\nAtualmente há apenas você de líder no seu estado. Vamos aumentar este número para 10 líderes?');
					session.send('Compartilhe isto com os seus amigos! Assim nós teremos mais força para incentivar a transparência em seu estado!');
					if (session.message.address.channelId === 'facebook') {
						session.send(msg);
					}
				}
			})
			.catch((e) => {
				console.log(`Error${e}`);
				session.send('Oooops, tive um problema ao iniciar suas missões, tente novamente mais tarde e entre em contato conosco.');
				session.endDialogWithResult({ resumed: builder.ResumeReason.notCompleted });
				throw e;
			});

		UserMission.update({
			completed: true,
			metadata: answers,
		}, {
			where: {
				user_id: user.id,
				mission_id: 1,
				completed: false,
			},
			returning: true,
		})
			.then((result) => {
				console.log(`${result}Mission updated sucessfuly`);
				builder.Prompts.choice(
					session,
					`Agora pode ficar tranquilo que eu irei te chamar quando a gente puder começar a segunda missão, okay? ${emoji.get('grinning')}`,
					[Confirm, WelcomeBack],
					{
						listStyle: builder.ListStyle.button,
						retryPrompt: retryPrompts.choice,
					} // eslint-disable-line comma-dangle
				);
			})
			.catch((err) => {
				console.log(`Error updating mission${err}`);
				session.send('Oooops...Tive um problema ao criar seu cadastro. Tente novamente mais tarde.');
				session.endDialogWithResult({ resumed: builder.ResumeReason.notCompleted });
				throw err;
			});
	},

	(session, args) => {
		switch (args.response.entity) {
		case Confirm:
			session.send('No momento, pararemos por aqui. ' +
					'\n\nSe quiser conversar comigo novamente, basta me mandar qualquer mensagem.');
			session.send(`Estarei te esperando. ${emoji.get('relaxed').repeat(2)}`);
			session.endConversation();
			break;
		default: // WelcomeBack
			session.endDialog();
		}
	},
]).cancelAction('cancelAction', '', {
	matches: /^cancel$|^cancelar$|^voltar$|^in[íi]cio$|^desisto/i,
});

module.exports = library;
