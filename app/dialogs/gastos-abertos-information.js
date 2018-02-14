/* global  bot:true builder:true */

bot.library(require('./contact'));

const retryPrompts = require('../misc/speeches_utils/retry-prompts');
const emoji = require('node-emoji');

const library = new builder.Library('gastosAbertosInformation');

const accessLaw = 'Dados abertos?';
const contact = 'Entrar em contato';
const reset = 'Voltar ao início';
// const signEmail = 'Cadastrar e-mail';
// const changeEmail = 'Trocar e-mail';
// const keepEmail = 'Manter o mesmo';
// let User;

library.dialog('/', [
	(session) => {
		// [User] = [args.User];
		session.sendTyping();
		session.send('A equipe Gastos Abertos tem o objetivo de conectar cidadãos com o orçamento público.' +
		'\n\nAcreditamos na mobilização e na educação cidadã sobre transparência nos municípios brasileiros.');
		session.replaceDialog('/promptButtons');
	},
]);

library.dialog('/promptButtons', [
	(session) => {
		builder.Prompts.choice(
			session,
			`Como posso te ajudar? ${emoji.get('slightly_smiling_face').repeat(2)}`,
			[accessLaw, contact, reset],
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
/*
library.dialog('/signEmail', [
	(session) => {
		session.send('Aqui você poderá vincular o seu e-mail ao projeto! ' +
		`${emoji.get('slightly_smiling_face').repeat(2)}`);
		User.findOne({
			where: { fb_id: session.userData.userid },
		}).then((user) => {
			if (user.get('email') === 'undefined') { // in case there's no e-mail
				session.replaceDialog('/askEmail');
			} else {
				session.send(`O e-mail '${user.get('email')}' já está cadastrado`);
				session.replaceDialog('/changeEmail');
			}
		}).catch((err) => {
			console.log(err);
			session.send(`Desculpe-me. ${emoji.get('dizzy_face').repeat(2)}.`);
			session.replaceDialog('/promptButtons');
		});
	},
]);

library.dialog('/askEmail', [
	(session) => {
		session.beginDialog('validators:email', {
			prompt: `Digite seu e-mail ou entre com 'cancelar' para voltar ${emoji.get('email')}`,
			retryPrompt: retryPrompts.email,
			maxRetries: 5,
		});
	},
	(session, args) => {
		if (args.resumed) {
			session.send(`Você tentou inserir um e-mail inválido muitas vezes.` +
			' ${emoji.get('dizzy_face').repeat(2)} Tente novamente mais tarde.');
		} else if (args.response === true) {
			session.replaceDialog('/promptButtons');
		} else {
			User.findOne({
				where: { fb_id: session.userData.userid },
			}).then((user) => {
				user.updateAttributes({
					email: args.response,
				});
				session.send(`E-mail cadastrado com sucesso! ${emoji.get('sunglasses').repeat(2)}`);
				session.replaceDialog('/promptButtons');
			}).catch((err) => {
				console.log(err);
				session.send(`Desculpe-me. ${emoji.get('dizzy_face').repeat(2)}`);
			});
		}
	},
]).customAction({
	matches: /^cancel$|^cancelar$|^voltar$|^in[íi]cio$|^começar/i,
	onSelectAction: (session) => {
		session.endDialog();
	},
});

library.dialog('/changeEmail', [
	(session) => {
		builder.Prompts.choice(
			session,
			'Você pode trocar o e-mail cadastrado por outro ou manter o mesmo.',
			[changeEmail, keepEmail],
			{
				listStyle: builder.ListStyle.button,
				retryPrompt: retryPrompts.choiceIntent,
				promptAfterAction: false,
			} // eslint-disable-line comma-dangle
		);
	},
	(session, result) => {
		session.sendTyping();
		if (result.response) {
			switch (result.response.entity) {
			case changeEmail:
				session.replaceDialog('/askEmail');
				break;
			default: // keepEmail
				session.replaceDialog('/promptButtons');
				break;
			}
		}
	},
]).customAction({
	matches: /^cancel$|^cancelar$|^voltar$|^in[íi]cio$|^começar/i,
	onSelectAction: (session) => {
		session.endDialog();
	},
});
*/

module.exports = library;
