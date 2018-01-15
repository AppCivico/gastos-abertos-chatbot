/* global  bot:true builder:true */

bot.library(require('./game-sign-up'));
bot.library(require('./contact'));

const retryPrompts = require('../misc/speeches_utils/retry-prompts');
const emoji = require('node-emoji');

const library = new builder.Library('gastosAbertosInformation');

const gastosAbertosCicles = 'O que é um ciclo';
const gameSignUp = 'Inscrever-se';
const GastosAbertosCicleResults = 'Resultados';
const contact = 'Entrar em contato';
const reset = 'Voltar ao início';
const yes = 'Sim, vamos lá!';
const no = 'Ainda não';

library.dialog('/', [
	(session) => {
		session.sendTyping();
		builder.Prompts.choice(
			session,
			'A equipe Gastos Abertos tem o objetivo de conectar cidadãos com o orçamento público.' +
			'\n\nAcreditamos na mobilização e na educação cidadã sobre transparência nos municípios brasileiros.' +
			'\n\n\nVocê pode escolher um dos itens abaixo para saber mais. O que acha?',
			[gastosAbertosCicles, GastosAbertosCicleResults,
				gameSignUp, contact, reset],
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
			case gastosAbertosCicles:
				session.replaceDialog('/gastosAbertosCicles');
				break;
			case gameSignUp:
				session.replaceDialog('/gameSignUpConfirmation');
				break;
			case GastosAbertosCicleResults:
				session.replaceDialog('/GastosAbertosCicleResults');
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
]).cancelAction('cancelAction', '', {
	matches: /^cancel$|^cancelar$|^desisto/i,
});

library.dialog('/promptButtons', [
	(session) => {
		session.sendTyping();
		builder.Prompts.choice(
			session,
			'Sobre o que deseja saber mais? ',
			[gastosAbertosCicles, GastosAbertosCicleResults,
				gameSignUp, contact, reset],
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
			case gastosAbertosCicles:
				session.replaceDialog('/gastosAbertosCicles');
				break;
			case gameSignUp:
				session.beginDialog('/gameSignUpConfirmation');
				break;
			case GastosAbertosCicleResults:
				session.replaceDialog('/GastosAbertosCicleResults');
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
]).cancelAction('cancelAction', '', {
	matches: /^cancel$|^cancelar$|^desisto/i,
});

library.dialog('/gastosAbertosCicles', [
	(session) => {
		session.send('Um ciclo do Gastos Abertos é um período onde pessoas desenvolvem missões (avaliação de portal de transparência da cidade, ' +
				'formulação de um pedido de acesso a informação e avaliação das respostas obtidas pelas prefeituras) para tornarem-se lideranças regionais.' +
				'\n\nEssas missões impactarão a transparência no município que o líder representa.' +
				'\n\nParticipe!');
		session.replaceDialog('/promptButtons');
	},
]);

library.dialog('/GastosAbertosCicleResults', [
	(session) => {
		session.send('O Gastos Abertos (2016-2017), teve 356 lideranças inscritas, 216 municípios atendidos, 165 avaliações de portais ' +
		'de transparência e 53 pedidos realizados. ' +
		'\n\nContamos com você para atingir novas metas!');
		session.replaceDialog('/promptButtons');
	},
]);

library.dialog('/gameSignUpConfirmation', [
	(session) => {
		session.sendTyping();
		builder.Prompts.choice(
			session,
			'Uhu! Seja bem vindo ao time.\n\n\nSerei seu agente virtual em todas as missões.' +
			`\n\n\nCom Guaxi, missão dada é missão cumprida. ${emoji.get('sign_of_the_horns').repeat(2)}\n\nVamos começar?`,
			[yes, no],
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
			case yes: // Sign up accepted
				session.beginDialog('gameSignUp:/');
				break;
			default: // no
				session.send(`OK. Estarei aqui caso mudar de ideia. ${emoji.get('slightly_smiling_face')}` +
				`${emoji.get('upside_down_face')}${emoji.get('slightly_smiling_face')}`);
				session.endDialog();
				break;
			}
		}
	},
	(session) => {
		session.replaceDialog('/promptButtons');
	},
]).cancelAction('cancelAction', '', {
	matches: /^cancel$|^cancelar$|^desisto/i,
});

module.exports = library;