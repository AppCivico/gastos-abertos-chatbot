/* global  bot:true */

bot.library(require('./game-sign-up'));
bot.library(require('./contact'));

const retryPrompts = require('../misc/speeches_utils/retry-prompts');
const builder = require('botbuilder');

const library = new builder.Library('gastosAbertosInformation');

const gastosAbertosCicles = 'O que é um ciclo';
const gameSignUp = 'Inscrição';
const firstGastosAbertosCicleResults = 'Resultados';
const contact = 'Entrar em contato';
const reset = 'Voltar ao início';
const yes = 'Sim, vamos lá!';
const no = 'Não';

// TODO mil coisas aqui

library.dialog('/', [
	(session) => {
		session.sendTyping();
		builder.Prompts.choice(
			session,
			'A equipe Gastos Abertos tem o objetivo de conectar cidadãos com o orçamento público.' +
			'\n\nAcreditamos na mobilização e na educação cidadã sobre transparência nos municípios brasileiros.' +
			'\n\n\nVocê pode escolher um dos itens abaixo para saber mais. O que acha?',
			[gastosAbertosCicles, gameSignUp,
				firstGastosAbertosCicleResults, contact, reset],
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
			case gameSignUp:
				session.replaceDialog('/gameSignUpConfirmation');
				break;
			case firstGastosAbertosCicleResults:
				session.replaceDialog('/firstGastosAbertosCicleResults');
				break;
			case gastosAbertosCicles:
				session.replaceDialog('/gastosAbertosCicles');
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
		session.replaceDialog('/');
	},
]).triggerAction({
	matches: /^cancelar$/i,
	onSelectAction: (session) => {
		session.replaceDialog('/welcomeBack');
	},
});

library.dialog('/gastosAbertosCicles', [
	(session) => {
		session.sendTyping();
		builder.Prompts.choice(
			session,
			'Um ciclo do Gastos Abertos é um período onde pessoas desenvolvem missões (avaliação de portal de transparência da cidade, ' +
			'formulação de um pedido de acesso a informação e avaliação das respostas obtidas pelas prefeituras) para tornarem-se lideranças regionais.' +
			'\n\nEssas missões impactarão a transparência no município que o líder representa.' +
			'\n\nParticipe!',
			[gameSignUp, firstGastosAbertosCicleResults, contact, reset],
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
			case firstGastosAbertosCicleResults:
				session.replaceDialog('/firstGastosAbertosCicleResults');
				break;
			case gameSignUp:
				session.replaceDialog('/gameSignUpConfirmation');
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
		session.replaceDialog('/');
	},
]).triggerAction({
	matches: /^cancelar$/i,
	onSelectAction: (session) => {
		session.replaceDialog('/welcomeBack');
	},
});

library.dialog('/firstGastosAbertosCicleResults', [
	(session) => {
		session.sendTyping();
		builder.Prompts.choice(
			session,
			'O Gastos Abertos (2016-2017), teve 356 lideranças inscritas, 216 municípios atendidos, 165 avaliações de portais ' +
			'de transparência e 53 pedidos realizados. ' +
			'\n\nContamos com você para atingir novas metas.',
			[gameSignUp, contact, gastosAbertosCicles, reset],
			{
				listStyle: builder.ListStyle.button,
				retryPrompt: retryPrompts.choice,
			} // eslint-disable-line comma-dangle
		);
	},
	(session, result) => {
		if (result.response) {
			session.sendTyping();
			switch (result.response.entity) {
			case gameSignUp:
				session.replaceDialog('/gameSignUpConfirmation');
				break;
			case contact:
				session.beginDialog('contact:/');
				break;
			case gastosAbertosCicles:
				session.replaceDialog('/gastosAbertosCicles');
				break;
			default: // reset
				session.endDialog();
				break;
			}
		}
	},

	(session) => {
		session.replaceDialog('/');
	},
]).triggerAction({
	matches: /^cancelar$/i,
	onSelectAction: (session) => {
		session.replaceDialog('/welcomeBack');
	},
});

library.dialog('/gameSignUpConfirmation', [
	(session) => {
		session.sendTyping();
		builder.Prompts.choice(
			session,
			'Uhu! Seja bem vindo ao time.\n\n\nSerei seu agente virtual em todas as missões.' +
			'\n\n\nCom Guaxi, missão dada é missão cumprida.\nVamos começar?',
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
			case yes:
				session.beginDialog('gameSignUp:/');
				break;
			default: // no
				session.replaceDialog('/gameSignUpDeclined');
				break;
			}
		}
	},
]);

library.dialog('/gameSignUpDeclined', [
	(session) => {
		session.sendTyping();
		builder.Prompts.choice(
			session,
			'Ok! Posso te ajudar com alguma informação sobre',
			[firstGastosAbertosCicleResults,
				gastosAbertosCicles, contact, reset],
			{
				listStyle: builder.ListStyle.button,
				retryPrompt: retryPrompts.choice,
			} // eslint-disable-line comma-dangle
		);
	},
	(session, result) => {
		if (result.response) {
			session.sendTyping();
			switch (result.response.entity) {
			case firstGastosAbertosCicleResults:
				session.replaceDialog('/firstGastosAbertosCicleResults');
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
		session.replaceDialog('/');
	},
]).triggerAction({
	matches: /^cancelar$/i,
	onSelectAction: (session) => {
		session.replaceDialog('/welcomeBack');
	},
});

module.exports = library;
