/* global  bot:true builder:true */

bot.library(require('./contact'));

const custom = require('../misc/custom_intents');
const retryPrompts = require('../misc/speeches_utils/retry-prompts');
const emoji = require('node-emoji');

const library = new builder.Library('gastosAbertosInformation');

const accessLaw = 'Dados abertos?';
const contact = 'Entrar em contato';
const reset = 'Voltar ao início';
const receiveMessage = 'Receber Mensagem';
let receiveDialog;
let receiveYes;
let receiveNo;
let newAddress;

let User;

library.dialog('/', [
	(session, args) => {
		[User] = [args.User];
		session.sendTyping();
		session.send('A equipe Gastos Abertos tem o objetivo de conectar cidadãos com o orçamento público.' +
		'\n\nAcreditamos na mobilização e na educação cidadã sobre transparência nos municípios brasileiros.');
		session.replaceDialog('/promptButtons');
	},
]);

library.dialog('/promptButtons', [
	(session) => {
		custom.updateSession(session.userData.userid, session);
		builder.Prompts.choice(
			session,
			`Como posso te ajudar? ${emoji.get('slightly_smiling_face').repeat(2)}`,
			[accessLaw, receiveMessage, contact, reset],
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
				session.beginDialog('/accessLaw');
				break;
			case receiveMessage:
				session.beginDialog('/receiveMessage');
				break;
			case contact:
				session.beginDialog('contact:/');
				break;
			default: // reset
				session.endDialog();
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
		session.endDialog();
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
			if (user.get('address') === null) {
				receiveDialog = 'No momento, você não está recebendo nenhum de nossas mensagens diretas.\n\nDeseja começar a recebê-las?';
				receiveYes = 'Sim, quero receber!';
				receiveNo = 'Não quero receber';
				newAddress = session.message.address;
			} else {
				receiveDialog = 'Você já recebe nossas mensagens diretas. Deseja parar de recebê-las?';
				receiveYes = 'Parar de receber';
				receiveNo = 'Continuar recebendo';
				newAddress = null;
			}
			session.replaceDialog('/updateAddress');
		}).catch((err) => {
			console.log(err);
			session.send(`Desculpe-me. ${emoji.get('dizzy_face').repeat(2)}. Estou com problemas técnicos no momento.`);
			session.replaceDialog('/promptButtons');
		});
	},
]);

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
				User.update({
					address: newAddress,
				}, {
					where: {
						fb_id: session.userData.userid,
					},
					returning: true,
				})
					.then(() => {
						session.send(`Suas preferências foram atualizadas! ${emoji.get('slightly_smiling_face').repeat(2)}`);
						console.log('User address updated sucessfuly');
					})
					.catch((err) => {
						session.send(`Desculpe-me. ${emoji.get('dizzy_face').repeat(2)}. Estou com problemas técnicos no momento.` +
						'\n\nTente novamente mais tarde.');
						console.log(err);
						throw err;
					}).finally(() => {
						session.replaceDialog('/promptButtons');
					});
				break;
			default: // receiveNo
				session.send('Ok! Suas preferências não foram atualizadas');
				session.replaceDialog('/promptButtons');
				break;
			}
		}
	},
]);

module.exports = library;
