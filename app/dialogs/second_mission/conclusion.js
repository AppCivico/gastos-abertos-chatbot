/* global builder:true chatBase:true */

const emoji = require('node-emoji');

const library = new builder.Library('secondMissionConclusion');

const retryPrompts = require('../../misc/speeches_utils/retry-prompts');
const saveSession = require('../../misc/save_session');
const errorLog = require('../../misc/send_log');

const Notification = require('../../server/schema/models').notification;
const User = require('../../server/schema/models').user;
const UserMission = require('../../server/schema/models').user_mission;

const HappyYes = 'Vamos lá!';
const Yes = 'Sim';
const notYet = 'Ainda Não';
const No = 'Não';
const WelcomeBack = 'Voltar para o início';
let user;

const answers = {
	userProtocoledRequest: '',
	govAnswered: '',
	answerWasSatisfactory: '',
};

library.dialog('/', [
	(session, args) => {
		saveSession.updateSession(session.userData.userid, session);
		if (!args.user && args.user_mission) {
			session.send('Ooops, houve algum problema, vamos voltar para o início.');
			session.replaceDialog('*:/getStarted');
		}
		[user] = [args.user];
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

	(session) => {
		session.replaceDialog('/secondMissionQuestions', { user });
	},
]).cancelAction('cancelAction', '', {
	matches: /^cancel$|^cancelar$|^voltar$|^in[íi]cio$|^começar/i,
});

library.dialog('/secondMissionQuestions', [
	(session, args) => {
		saveSession.updateSession(session.userData.userid, session, { answers, user });
		[user] = [args.user];
		session.sendTyping();
		// reloadArgs(args);

		builder.Prompts.choice(
			session,
			'Você protocolou o pedido de acesso à informação?',
			[Yes, notYet],
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
				chatBase.MessageHandled('Lai-Answer-Protocol-Yes', 'User Protocolated Lai');
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
			default: // notYet
				session.send(`Que pena! ${emoji.get('cold_sweat')} No entanto, recomendamos que você o protocolize mesmo assim ` +
				'pois é muito importante que a sociedade civil demande dados. ' +
				'\nDepois de protocolar, você poderá responder esse questionário em \'Gerar Pedido\'. ');
				session.replaceDialog('*:/getStarted');
				break;
			}
		}
	},

	(session, result) => {
		if (result.response) {
			switch (result.response.entity) {
			case Yes:
				chatBase.MessageHandled('Lai-Answer-Protocol-Prefecture-Yes', 'Prefecture Answered Protocol');
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
				chatBase.MessageHandled('Lai-Answer-Protocol-Prefecture-No', 'Prefecture Didnt Answer Protocol');
				answers.govAnswered = 0;
				session.send(`Que pena! ${emoji.get('cold_sweat').repeat(2)} No entanto, não vamos desistir!`);
				session.send('Se houve alguma irregularidade no processo ou você ficou com dúvidas, ' +
				'encaminhe uma mensagem para a Controladoria Geral da União:\n\n' +
				'https://sistema.ouvidorias.gov.br/publico/Manifestacao/RegistrarManifestacao.aspx');
				// session.replaceDialog('*:/promptButtons');
				session.replaceDialog('/conclusion');

				break;
			}
		}
	},

	(session, result) => {
		if (result.response) {
			switch (result.response.entity) {
			case Yes:
				chatBase.MessageHandled('Lai-Answer-Protocol-Prefecture-Satisfactory-Yes', 'Answer from Prefecture was Satisfactory');
				answers.answerWasSatisfactory = 1;
				break;
			default: // No
				chatBase.MessageHandled('Lai-Answer-Protocol-Prefecture-Satisfactory-No', 'Answer from Prefecture wasnt Satisfactory');
				answers.answerWasSatisfactory = 0;
				break;
			}
			session.replaceDialog('/conclusion');
		}
	},
]).cancelAction('cancelAction', '', {
	matches: /^cancel$|^cancelar$|^voltar$|^in[íi]cio$|^começar/i,
});

library.dialog('/conclusion', [
	(session, args, next) => {
		saveSession.updateSession(session.userData.userid, session, { answers, user });
		User.findOne({
			attributes: ['id'],
			where: { fb_id: session.userData.userid },
		}).then((userData) => {
			user = userData.dataValues;
			next();
		}).catch((err) => {
			errorLog.storeErrorLog(session, `Error finding user => ${err}`);
			session.send(`Tive um problema ao salvar suas respostas. ${emoji.get('dizzy_face').repeat(2)}. ` +
			'Estarei tentando resolver o problema. Tente novamente mais tarde.');
			session.replaceDialog('*:/getStarted');
		});
	},
	(session) => {
		UserMission.update({
			completed: true, // False is for testing
			metadata: answers,
		}, {
			where: {
				user_id: user.id,
				mission_id: 2,
				completed: false,
			},
			returning: true,
		}).then(() => {
			Notification.update({
				// sentAlready == true and timeSent == null
				// means that no message was sent, because there was no need to
				sentAlready: true,
			}, {
				where: {
					userID: user.id,
					missionID: 3,
				},
			}).then(() => {
				console.log('Notification Updated! This message will not be sent!');
			}).catch((err) => {
				errorLog.storeErrorLog(session, `Error updating notification => ${err}`);
			});
			session.replaceDialog('/congratulations');
		}).catch((err) => {
			errorLog.storeErrorLog(session, `Error updating userMission => ${err}`);
			session.send(`Tive um problema ao gravar suas respostas. ${emoji.get('dizzy_face').repeat(2)}. ` +
			'Estarei tentando resolver o problema. Tente novamente mais tarde.');
			session.replaceDialog('*:/getStarted');
		});
	} // eslint-disable-line comma-dangle
]).cancelAction('cancelAction', '', {
	matches: /^cancel$|^cancelar$|^voltar$|^in[íi]cio$|^começar/i,
});

library.dialog('/congratulations', [
	(session) => {
		saveSession.updateSession(session.userData.userid, session);
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
			'Você pode também nos contatar para tirar alguma dúvida ou relatar suas ações.' +
			` ${emoji.get('slightly_smiling_face').repeat(2)}`,
			[WelcomeBack],
			{
				listStyle: builder.ListStyle.button,
				retryPrompt: retryPrompts.choice,
			} // eslint-disable-line comma-dangle
		);
	},

	(session, args) => {
		switch (args.response.entity) {
		default: // WelcomeBack
			session.replaceDialog('*:/getStarted');
		}
	},
]).cancelAction('cancelAction', '', {
	matches: /^cancel$|^cancelar$|^voltar$|^in[íi]cio$|^começar/i,

});

module.exports = library;
