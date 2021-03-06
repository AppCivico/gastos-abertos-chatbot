/* global bot:true builder:true chatBase:true */

const retryPrompts = require('../misc/speeches_utils/retry-prompts');
const emoji = require('node-emoji');
const saveSession = require('../misc/save_session');
const errorLog = require('../misc/send_log');

const library = new builder.Library('gastosAbertosInformation');
bot.library(require('./contact'));

const User = require('../server/schema/models').user;

const accessLaw = 'Saber mais';
const goBack = 'Voltar ao início';
const receiveMessage = 'Receber Mensagens?';
const Contato = 'Contato';
let receiveDialog;
let receiveYes;
let receiveNo;
let booleanMessage;

library.dialog('/', [
	(session) => {
		session.sendTyping();
		session.send('A equipe Gastos Abertos tem o objetivo de conectar cidadãos com o orçamento público.' +
		'\n\nAcreditamos na mobilização e na educação cidadã sobre transparência nos municípios brasileiros.');
		session.replaceDialog('/promptButtons');
	},
]);

library.dialog('/promptButtons', [
	(session) => {
		saveSession.updateSession(session.userData.userid, session);
		builder.Prompts.choice(
			session,
			`Como posso te ajudar? ${emoji.get('slightly_smiling_face').repeat(2)}`,
			[accessLaw, receiveMessage, Contato, goBack],
			{
				listStyle: builder.ListStyle.button,
				retryPrompt: retryPrompts.about,
			} // eslint-disable-line comma-dangle
		);
	},

	(session, result) => {
		session.sendTyping();
		if (result.response) {
			switch (result.response.entity) {
			case accessLaw:
				session.replaceDialog('/accessLaw');
				break;
			case receiveMessage:
				session.replaceDialog('/receiveMessage');
				break;
			case Contato:
				session.replaceDialog('contact_doubt:/');
				break;
			default: // goBack
				session.replaceDialog('*:/getStarted');
				break;
			}
		}
	},
	(session) => {
		session.replaceDialog('/promptButtons');
	},
]).customAction({
	matches: /^cancel$|^cancelar$|^voltar$|^in[íi]cio$|^começar/i,
	onSelectAction: (session) => {
		session.replaceDialog('*:/getStarted');
	},
});

library.dialog('/accessLaw', [
	(session) => {
		session.send('A LAI (Lei de Acesso à Informação, lei N.12.527) entrou em vigor no dia 16 de maio de 2012 e ' +
		'criou mecanismos que possibilitam, a qualquer pessoa, física ou jurídica, sem necessidade de apresentar motivo, ' +
		'o recebimento de informações públicas dos órgãos e entidades.');
		session.send('A Lei vale para os três Poderes da União, Estados, Distrito Federal e Municípios, inclusive aos Tribunais de Conta e Ministério Público.');
		session.send('Para conheçer mais sobre a LAI, consulte o Guia Prático da Lei de Acesso à Informação disponibilizado pelo ARTIGO 19: ' +
		'http://artigo19.org/wp-content/blogs.dir/24/files/2016/10/Guia-Pr%C3%A1tico-da-Lei-de-Acesso-%C3%A0-Informa%C3%A7%C3%A3o.pdf');
		session.replaceDialog('/promptButtons');
	},
]);

library.dialog('/receiveMessage', [
	(session) => {
		User.findOne({
			where: { fb_id: session.userData.userid },
		}).then((user) => {
			if (user.get('receiveMessage') === null || user.get('receiveMessage') === false) {
				receiveDialog = 'No momento, você não está recebendo nenhum de nossas mensagens diretas.\n\nDeseja começar a recebê-las?';
				receiveYes = 'Sim, quero receber!';
				receiveNo = 'Não quero receber';
				booleanMessage = true;
			} else {
				receiveDialog = 'Você já recebe nossas mensagens diretas. \n\nDeseja parar de recebê-las?';
				receiveYes = 'Parar de receber';
				receiveNo = 'Continuar recebendo';
				booleanMessage = false;
			}
			session.replaceDialog('/updateAddress');
		}).catch((err) => {
			errorLog.storeErrorLog(session, `Error finding user => ${err}`);
			session.send(`Ocorreu um erro! ${emoji.get('dizzy_face').repeat(2)}. Tente novamente mais tarde.`);
			session.replaceDialog('*:/getStarted');
		});
	},
]);

// updates address and receiveMessage
library.dialog('/updateAddress', [
	(session) => {
		builder.Prompts.choice(
			session, receiveDialog,	[receiveYes, receiveNo],
			{
				listStyle: builder.ListStyle.button,
				retryPrompt: retryPrompts.about,
			} // eslint-disable-line comma-dangle
		);
	},

	(session, result) => {
		if (result.response) {
			switch (result.response.entity) {
			case receiveYes:
				if (booleanMessage === true) {
					chatBase.MessageHandled('User-Wants-to-receive-Messages', 'User went to menu and chose to start(or keep) receiving messages');
				} else {
					chatBase.MessageHandled('User-Doenst-Want-to-receive-Messages', 'User went to menu and chose to stop receiving messages');
				}
				User.update({
					address: session.message.address,
					receiveMessage: booleanMessage,
				}, {
					where: {
						fb_id: session.userData.userid,
					},
					returning: true,
				}).then(() => {
					session.send(`Suas preferências foram atualizadas! ${emoji.get('slightly_smiling_face').repeat(2)}`);
				}).catch((err) => {
					errorLog.storeErrorLog(session, `Error finding user => ${err}`);
					session.send(`Ocorreu um erro! ${emoji.get('dizzy_face').repeat(2)}. Tente novamente mais tarde.`);
				}).finally(() => {
					session.replaceDialog('/promptButtons');
				});
				break;
			default: // receiveNo
				session.send(`Ok! Suas preferências não foram atualizadas. ${emoji.get('slightly_smiling_face').repeat(2)}`);
				session.replaceDialog('/promptButtons');
				break;
			}
		}
	},
]);

module.exports = library;
