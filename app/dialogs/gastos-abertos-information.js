/* global  bot:true builder:true */

bot.library(require('./game-sign-up'));
bot.library(require('./contact'));

const retryPrompts = require('../misc/speeches_utils/retry-prompts');
const emoji = require('node-emoji');

const library = new builder.Library('gastosAbertosInformation');

const gastosAbertosCicles = 'O que é um ciclo';
const gastosAbertosCicleResults = 'Resultados';
const aboutUs = 'Quem Somos';
const contact = 'Entrar em contato';
const reset = 'Voltar ao início';

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
		builder.Prompts.choice(
			session,
			`Sobre o que deseja saber mais? ${emoji.get('slightly_smiling_face').repeat(2)}`,
			[aboutUs, gastosAbertosCicleResults,
				gastosAbertosCicles, contact, reset],
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
			case gastosAbertosCicles:
				session.replaceDialog('/gastosAbertosCicles');
				break;
			case gastosAbertosCicleResults:
				session.replaceDialog('/gastosAbertosCicleResults');
				break;
			case aboutUs:
				session.beginDialog('/aboutUs');
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
	matches: /^cancel$|^cancelar$|^voltar$|^in[íi]cio$|^desisto/i,
	onSelectAction: (session) => {
		session.endDialog();
	},
});


library.dialog('/gastosAbertosCicles', [
	(session) => {
		session.send('Um ciclo do Gastos Abertos é um período onde pessoas desenvolvem missões (avaliação de portal de transparência da cidade, ' +
				'formulação de um pedido de acesso a informação e avaliação das respostas obtidas pelas prefeituras) para tornarem-se lideranças regionais.' +
				'Essas missões impactarão a transparência no município que o líder representa.' +
				'\n\nParticipe!');
		session.replaceDialog('/promptButtons');
	},
]);

library.dialog('/gastosAbertosCicleResults', [
	(session) => {
		session.send('O Gastos Abertos (2016-2017), teve 356 lideranças inscritas, 216 municípios atendidos, 165 avaliações de portais ' +
		'de transparência e 53 pedidos realizados. ' +
		'\n\nContamos com você para atingir novas metas!');
		session.replaceDialog('/promptButtons');
	},
]);

<<<<<<< HEAD
library.dialog('/aboutUs', [ // TODO melhorar isso aqui
=======
library.dialog('/aboutUs', [
>>>>>>> origin/intent
	(session) => {
		session.send('O Gastos Abertos tem como objetivo conscientizar e capacitar o cidadão em relação á Lei de Acesso á Informação.' +
		'\n\nNosso site oficial: https://gastosabertos.org/' +
		'\n\nNosso grupo de what\'sapp: https://chat.whatsapp.com/Flm0oYPVLP0KfOKYlUidXS');
		session.replaceDialog('/promptButtons');
	},
]);

module.exports = library;