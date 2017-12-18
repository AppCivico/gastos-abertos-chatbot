/* global  bot:true builder:true */
/* eslint no-param-reassign: ["error", { "props": true, "ignorePropertyModificationsFor":
["session"] }] */

require('dotenv').config();
require('./connectorSetup.js')();

const dateFns = require('date-fns');
const retryPrompts = require('./misc/speeches_utils/retry-prompts');

bot.library(require('./validators'));
bot.library(require('./dialogs/game-sign-up'));
bot.library(require('./dialogs/contact'));
bot.library(require('./dialogs/gastos-abertos-information'));
bot.library(require('./dialogs/game'));


const GameSignUp = 'Inscrição 2º Ciclo';
const GastosAbertosInformation = 'Sobre o projeto';
const Contact = 'Entrar em contato';
const Informacoes = 'Informações';
const Game = 'Processo de missões';
const Missions = 'Concluir missões';
const InformationAcessRequest = 'Gerar pedido';

const maxSignUpDate = dateFns.format(new Date(2017, 8, 28), 'M/DD/YYYY');
const today = dateFns.format(new Date(), 'MM/DD/YYYY');

bot.beginDialogAction('getstarted', '/getstarted');
bot.beginDialogAction('reset', '/reset');

bot.dialog('/', [
	(session) => {
		session.replaceDialog('/promptButtons');
	},
]).triggerAction({ matches: [GameSignUp, Informacoes, Contact] });

bot.dialog('/getstarted', [
	(session) => {
		session.sendTyping();
		if (!session.userData.firstRun) {
			session.userData.userid = session.message.sourceEvent.sender.id;
			session.userData.pageid = session.message.sourceEvent.recipient.id;

			session.replaceDialog('/welcomeBack');
		} else {
			session.replaceDialog('/promptButtons');
		}
	},
]);

bot.dialog('/promptButtons', [
	(session) => {
		session.sendTyping();
		session.send({
			attachments: [
				{
					contentType: 'image/jpeg',
					contentUrl: 'https://gallery.mailchimp.com/cdabeff22c56cd4bd6072bf29/images/8e84d7d3-bba7-43be-acac-733dd6712f78.png',
				},
			],
		});
		session.send('Olá, eu sou o Guaxi.\n\nSou o agente virtual do Gastos Abertos e seu parceiro em buscas e pesquisas.');
		builder.Prompts.choice(
			session,
			'Em que assunto eu posso te ajudar?',
			[GastosAbertosInformation, Game, InformationAcessRequest],
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
			case GastosAbertosInformation:
				session.beginDialog('gastosAbertosInformation:/');
				break;
			case Game:
				session.replaceDialog('/game');
				break;
			default: // InformationAcessRequest
				session.beginDialog('informationAccessRequest:/');
				break;
			}
		}
	},
]).cancelAction('cancelar', null, { matches: /^cancelar/i });

bot.dialog('/welcomeBack', [
	(session) => {
		session.sendTyping();
		session.send('Olá companheiro! Bem vindo de volta!');
		builder.Prompts.choice(
			session,
			'Em que assunto eu posso te ajudar?',
			[GastosAbertosInformation, Game, InformationAcessRequest],
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
			case GastosAbertosInformation:
				session.beginDialog('gastosAbertosInformation:/');
				break;
			case Game:
				session.replaceDialog('/game');
				break;
			default: // InformationAcessRequest
				session.beginDialog('informationAccessRequest:/');
				break;
			}
		}
	},
]).cancelAction('cancelar', null, { matches: /^cancelar/i });

bot.dialog('/game', [
	(session) => {
		session.sendTyping();
		builder.Prompts.choice(
			session,
			'O que você deseja fazer?',
			[GameSignUp, Missions],
			{
				listStyle: builder.ListStyle.button,
				retryPrompt: retryPrompts.choice,
			} // eslint-disable-line comma-dangle
		);
	},

	(session, result) => {
		if (result.response) {
			switch (result.response.entity) {
			case GameSignUp:
				session.beginDialog('gameSignUp:/');
				break;
			default: // Missions:
				session.beginDialog('game:/');
				break;
			}
		}
	},
]).cancelAction('cancelar', null, { matches: /^cancelar/i });

bot.dialog('/reset', [
	(session) => {
		session.endDialog();
		session.beginDialog('/');
	},
]);
