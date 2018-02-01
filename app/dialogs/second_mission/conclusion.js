/* global builder:true */

const library = new builder.Library('secondMissionConclusion');
const emoji = require('node-emoji');

const answers = {
	userProtocoledRequest: '',
	govAnswered: '',
	answerWasSatisfactory: '',
};

const retryPrompts = require('../../misc/speeches_utils/retry-prompts');

// const User = require('../../server/schema/models').user;
const UserMission = require('../../server/schema/models').user_mission;

const HappyYes = 'Vamos lá!';
const Yes = 'Sim';
const No = 'Não';
const Confirm = 'Beleza!';
const WelcomeBack = 'Voltar para o início';

let user;
// antigo user_mission, mudou para se encaixar na regra 'camel-case' e UserMission já existia
// let missionUser;

library.dialog('/', [
	(session, args) => {
		if (!args.user && args.user_mission) {
			session.send('Ooops, houve algum problema, vamos voltar para o início.');
			session.endDialog();
			session.beginDialog('/welcomeBack');
		}

		[user] = [args.user];
		//		missionUser = args.user_mission;

		session.sendTyping();
		builder.Prompts.choice(
			session,
			`Pelo o que vi aqui você está na segunda missão, vamos concluí-la?  ${emoji.get('slightly_smiling_face')}`,
			[HappyYes],
			{
				listStyle: builder.ListStyle.button,
				retryPrompt: retryPrompts.choice,
			} // eslint-disable-line comma-dangle
		);
	},

	(session, result) => {
		if (result.response) {
			switch (result.response.entity) {
			case HappyYes:
				session.replaceDialog('/secondMissionQuestions');
				break;
			default: // unlikelyYes
				session.replaceDialog('/secondMissionQuestions');
				break;
			}
		}
	},
]).cancelAction('cancelAction', '', {
	matches: /^cancel$|^cancelar$|^voltar$|^in[íi]cio$|^desisto/i,

});


library.dialog('/secondMissionQuestions', [
	(session) => {
		// (session, args) => {

		session.sendTyping();
		builder.Prompts.choice(
			session,
			'Você protocolou o pedido de acesso à informação?',
			[Yes, No],
			{
				listStyle: builder.ListStyle.button,
				retryPrompt: retryPrompts.choice,
			} // eslint-disable-line comma-dangle
		);
	},

	(session, result) => {
		if (result.response) {
			switch (result.response.entity) {
			case Yes:
				answers.userProtocoledRequest = 1;
				builder.Prompts.choice(
					session,
					'A prefeitura respondeu o seu pedido?',
					[Yes, No],
					{
						listStyle: builder.ListStyle.button,
						retryPrompt: retryPrompts.choice,
					} // eslint-disable-line comma-dangle
				);
				break;
			default: // No
				session.send(`Que pena! ${emoji.get('cold_sweat').repeat(2)} No entanto, recomendamos que você o protocolize mesmo assim ` +
				'pois é muito importante que a sociedade civil demande dados.');
				session.send('Agora vou te levar para o início.');
				session.endDialog();
				break;
			}
		}
	},

	(session, result) => {
		if (result.response) {
			switch (result.response.entity) {
			case Yes:
				answers.govAnswered = 1;
				builder.Prompts.choice(
					session,
					'A resposta da prefeitura foi satisfatória?',
					[Yes, No],
					{
						listStyle: builder.ListStyle.button,
						retryPrompt: retryPrompts.choice,
					} // eslint-disable-line comma-dangle
				);
				break;
			default: // No
				answers.govAnswered = 0;
				session.send(`Que pena! ${emoji.get('cold_sweat')} No entanto, não vamos desistir!`);
				session.send('Se houve alguma irregularidade no processo ou você ficou com dúvidas, ' +
				'encaminhe uma mensagem para a Controladoria Geral da União:\n\n' +
				'https://sistema.ouvidorias.gov.br/publico/Manifestacao/RegistrarManifestacao.aspx');
				session.replaceDialog('/conclusion');
				break;
			}
		}
	},

	(session, result) => {
		if (result.response) {
			switch (result.response.entity) {
			case Yes:
				answers.answerWasSatisfactory = 1;
				break;
			default: // No
				answers.answerWasSatisfactory = 0;
				break;
			}
		}

		session.replaceDialog('/conclusion');
	},
]).cancelAction('cancelAction', '', {
	matches: /^cancel$|^cancelar$|^voltar$|^in[íi]cio$|^desisto/i,

});

library.dialog('/conclusion', [
	(session) => {
		//		(session, args) => {
		UserMission.update({
			completed: true,
			metadata: answers,
		}, {
			where: {
				user_id: user.id,
				mission_id: 2,
				completed: false,
			},
			returning: true,
		})
			.then((result) => {
				console.log(`Mission updated sucessfuly: ${result}`);
				session.replaceDialog('/congratulations');
			})
			.catch((e) => {
				console.log(`Error updating mission: ${e}`);
				session.send('Oooops...Tive um problema ao criar seu cadastro. Tente novamente mais tarde.');
				session.endDialogWithResult({ resumed: builder.ResumeReason.notCompleted });
				throw e;
			});
	} // eslint-disable-line comma-dangle
]).cancelAction('cancelAction', '', {
	matches: /^cancel$|^cancelar$|^voltar$|^in[íi]cio$|^desisto/i,

});

library.dialog('/congratulations', [
	(session) => {
		session.send('Parabéns! Você concluiu o processo de missões do Gastos Abertos! Muito obrigado por participar comigo dessa tarefa! ' +
		`\n\nAposto que você e eu aprendemos muitas coisas novas nesse processo! ${emoji.get('slightly_smiling_face').repeat(2)}` +
		'\n\nDarei a você uma tarefa extra, ela é difícil, mas toda a equipe do Gastos Abertos está com você nessa!');
		session.send('Essa tarefa extra será buscar a assinatura de seu prefeito(a) para a Carta Compromisso do Gastos Abertos!' +
		'\n\nVocê pode encontrar a Carta nesse link: https://gastosabertos.org/participe/GastosAbertosCartaCompromisso.pdf');
		session.send('Mande uma mensagem lá no nosso grupo! Para entrar no Grupo de Lideranças do Gastos Abertos ' +
		'basta acessar o link abaixo do seu celular.\n\nTá cheio de gente para ajudar!' +
		'https://chat.whatsapp.com/Flm0oYPVLP0KfOKYlUidXS');

		builder.Prompts.choice(
			session,
			'Agora pode ficar tranquilo que eu irei te chamar quando a gente puder começar a terceira missão, okay? ' +
			`${emoji.get('slightly_smiling_face').repeat(2)}`,
			[Confirm, WelcomeBack],
			{
				listStyle: builder.ListStyle.button,
				retryPrompt: retryPrompts.choice,
			} // eslint-disable-line comma-dangle
		);
	},

	(session, args) => {
		switch (args.response.entity) {
		case Confirm:
		// TODO melhorar isso aqui e ali em cima com a terceira missão
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
