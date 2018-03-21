/* global  bot:true builder:true */
/* eslint no-param-reassign: ["error", { "props": true,
"ignorePropertyModificationsFor": ["session"] }] */
/* eslint no-plusplus: 0 */

const request = require('request');
const pdf = require('html-pdf');
const fs = require('fs');
const Base64File = require('js-base64-file');
const emoji = require('node-emoji');

const retryPrompts = require('../misc/speeches_utils/retry-prompts');
const saveSession = require('../misc/save_session');

bot.library(require('./second_mission/conclusion'));

const User = require('../server/schema/models').user;
const UserMission = require('../server/schema/models').user_mission;
const infoRequest = require('../server/schema/models').user_information_access_request;
const Notification = require('../server/schema/models').notification;

const library = new builder.Library('informationAccessRequest');

const Generate = 'Gerar Pedido';
const Denial = 'Ainda não';
const Feedback = 'Responder';
const Yes = 'Sim';
const No = 'Não';
const HappyYes = 'Vamos lá!';
const goBack = 'Voltar para o início';
let currentQuestion = ''; // repeats the current question after/if the retry.prompt is activated

let user;

// '' => no answer
// 0 => portal has thing, nice!
// 1 => portal doesn't has thing, we have to include in the request
const answers = {
	requesterName: '',
	answer1: '',
	answer2: '',
	answer3: '',
	answer4: '',
	answer5: '',
	answer6: '',
	answer7: '',
	answer8: '',
	answer9: '',
	answer10: '',
	answer11: '',
	answer12: '',
	answer13: '',
	questionNumber: 0,
};

let itens = []; // eslint-disable-line prefer-const

const generatedRequest = new Base64File();
const path = '/tmp/';
let file = '';

const apiUri = process.env.MAILCHIMP_API_URI;
const apiUser = process.env.MAILCHIMP_API_USER;
const apiKey = process.env.MAILCHIMP_API_KEY;

const headers = {
	'content-type': 'application/json',
};

library.dialog('/', [
	(session) => {
		User.findOne({
			attributes: ['id'],
			where: { fb_id: session.userData.userid },
		}).then((userData) => {
			user = userData;

			UserMission.findOrCreate({
				where: { // checks if exists
					user_id: user.id,
					mission_id: 2,
				},
				defaults: {
					user_id: user.id,
					mission_id: 2,
					metadata: { request_generated: 0 },
				},
				return: true,
			}).spread((missionData, created) => {
				console.log(`New mission 2 created? => ${created}`);
				if (missionData.metadata.request_generated !== 0) {
					session.beginDialog('/alreadyCreated');
				}	else {
					session.send('Vamos gerar informações sobre orçamento público na sua cidade? Para ' +
					'isto, irei lhe fazer diversas perguntas, e não se preocupe se não ' +
					'souber. Caso você não encontrar ou não ter certeza, sua resposta deve ser NÃO, ok?');
					session.send('Esse é um processo bem extenso e tem bastante conteúdo.' +
					`Caso você tenha qualquer tipo de dúvidas nos mande! ${emoji.get('writing_hand')} ` +
					'\n\nO grupo de lideranças é muito bom para isso! (https://chat.whatsapp.com/Flm0oYPVLP0KfOKYlUidXS)');
					session.send('Além disso, você pode a qualquer momento digitar \'começar\' e eu te levo para o início.');

					session.beginDialog('/askLAI');
				}
			}).catch((err) => {
				console.log(`Error findind or creating UserMission => ${err}`);
			});
		});
	},
]).cancelAction('cancelAction', '', {
	matches: /^cancel$|^cancelar$|^voltar$|^in[íi]cio$|^começar/i,
});

library.dialog('/alreadyCreated', [
	(session) => {
		builder.Prompts.choice(
			session,
			'Você já gerou um pedido de acesso a informação. Se quiser você poderá gerar outro ou contar-nos qual foi a resposta! ',
			[Generate, Feedback, Denial],
			{
				listStyle: builder.ListStyle.button,
				retryPrompt: retryPrompts.choice,
			} // eslint-disable-line comma-dangle
		);
	},

	(session, args) => {
		switch (args.response.entity) {
		case Generate:
			session.beginDialog('/questionOne');
			break;
		case Feedback:
			session.replaceDialog('secondMissionConclusion:/secondMissionQuestions', { user });
			break;
		default: // Denial
			session.send(`Okay! Eu estarei aqui esperando para terminarmos! ${emoji.get('wave').repeat(2)}`);
			session.beginDialog('*:/getStarted');
			break;
		}
	},
]).cancelAction('cancelAction', '', {
	matches: /^cancel$|^cancelar$|^voltar$|^in[íi]cio$|^começar/i,
});

library.dialog('/askLAI', [
	(session) => {
		saveSession.updateSession(session.userData.userid, session);
		session.sendTyping();
		builder.Prompts.choice(
			session,
			'Serão 13 perguntas no total. Vamos lá?',
			[Generate, Denial],
			{
				listStyle: builder.ListStyle.button,
				retryPrompt: retryPrompts.choice,
			} // eslint-disable-line comma-dangle
		);
	},

	(session, args) => {
		switch (args.response.entity) {
		case Generate:

			Notification.findOrCreate({
				where: { // checks if exists
					missionID: 2,
					userID: user.id,
				},
				defaults: {
					missionID: 2, // mission 2 and lone request are beign treated the same way
					userID: user.id,
					msgSent: 'Percebemos que você ainda não terminou de gerar um pedido de acesso a informação.' +
		'\n\nSe precisar de ajuda, entre em contato conosco ou visite nosso grupo de lideranças: https://chat.whatsapp.com/Flm0oYPVLP0KfOKYlUidXS',
				},
			}).catch((errNotification) => {
				console.log(`Couldn't save notification 2 :( -> ${errNotification})`);
			});

			session.send(`Legal! Boa sorte! ${emoji.get('v').repeat(3)}`);
			session.beginDialog('/questionOne');
			break;
		default: // Denial
			session.send(`Okay! Eu estarei aqui esperando para começarmos! ${emoji.get('wave').repeat(2)}`);
			session.beginDialog('*:/getStarted');
			break;
		}
	},
]).cancelAction('cancelAction', '', {
	matches: /^cancel$|^cancelar$|^voltar$|^in[íi]cio$|^começar/i,
});
library.dialog('/questionOne', [
	(session) => {
		saveSession.updateSession(session.userData.userid, session,	{ answers, user });
		// questionNumber shows the question number in each question(disabled 2 rules for this)
		answers.questionNumber = 1; // reseting value
		currentQuestion = `${answers.questionNumber} - Seu município identifica de onde vêm os recursos que ele recebe? ` +
		'\n- ele tem que identificar, pelo menos, se os recursos vêm da União, do estado, da cobrança de impostos ou de empréstimos.';
		builder.Prompts.choice(
			session, currentQuestion,
			[Yes, No],
			{
				listStyle: builder.ListStyle.button,
				retryPrompt: `${retryPrompts.request}\n\n${currentQuestion}`,
			} // eslint-disable-line comma-dangle
		);
	},
	(session, args) => {
		answers.questionNumber++; // in case of interruptions
		switch (args.response.entity) {
		case Yes:
			answers.answer1 = 0;
			break;
		default: // No
			answers.answer1 = 1;
			itens.push('<p> - Disponibilização sobre receitas, despesas e endividamento público, nos termos da Lei Complementar 131, ' +
			'de 27 de maio de 2009, e demais regras aplicáveis;</p>');
			break;
		}
		session.beginDialog('/questionTwo');
		// session.beginDialog('/questionEleven'); // for time-saving testing purposes
	},
]).cancelAction('cancelAction', '', {
	matches: /^cancel$|^cancelar$|^voltar$|^in[íi]cio$|^começar/i,
});

library.dialog('/questionTwo', [
	(session) => {
		saveSession.updateSession(session.userData.userid, session,	{ answers, user });
		currentQuestion = `${answers.questionNumber} - O portal de transparência disponibiliza dados referentes a remuneração de ` +
		'cada um dos agentes públicos, individualizada?';
		builder.Prompts.choice(
			session, currentQuestion,
			[Yes, No],
			{
				listStyle: builder.ListStyle.button,
				retryPrompt: `${retryPrompts.request}\n\n${currentQuestion}`,
			} // eslint-disable-line comma-dangle
		);
	},
	(session, args) => {
		answers.questionNumber++; // in case of interruptions
		switch (args.response.entity) {
		case Yes:
			answers.answer2 = 0;
			break;
		default: // No
			answers.answer2 = 1;
			itens.push('<p> - Disponibilização sobre remuneração de cada um dos agentes públicos, ' +
			'individualizada – o modelo do Portal da Transparência do Governo Federal é um exemplo;</p>');
			break;
		}
		session.beginDialog('/questionThree');
	},
]).cancelAction('cancelAction', '', {
	matches: /^cancel$|^cancelar$|^voltar$|^in[íi]cio$|^começar/i,
});

// /*
library.dialog('/questionThree', [
	(session) => {
		saveSession.updateSession(session.userData.userid, session,	{ answers, user });
		currentQuestion = `${answers.questionNumber} - O portal de transparência disponibiliza: a relação de pagamentos de diárias, ` +
		'a aquisição de passagens aéreas e adiantamento de despesas?';
		builder.Prompts.choice(
			session, currentQuestion,
			[Yes, No],
			{
				listStyle: builder.ListStyle.button,
				retryPrompt: `${retryPrompts.request}\n\n${currentQuestion}`,
			} // eslint-disable-line comma-dangle
		);
	},
	(session, args) => {
		answers.questionNumber++; // in case of interruptions
		switch (args.response.entity) {
		case Yes:
			answers.answer3 = 0;
			break;
		default: // No
			answers.answer3 = 1;
			itens.push('<p> - Disponibilização da relação de pagamentos de diárias, aquisição de passagens aéreas (destino e motivo da viagem) ' +
			'e adiantamento de despesas</p>');
			break;
		}
		session.beginDialog('/questionFour');
	},
]).cancelAction('cancelAction', '', {
	matches: /^cancel$|^cancelar$|^voltar$|^in[íi]cio$|^começar/i,
});

library.dialog('/questionFour', [
	(session) => {
		saveSession.updateSession(session.userData.userid, session,	{ answers, user });
		currentQuestion = `${answers.questionNumber} - O portal de transparência disponibiliza as despesas realizadas com cartões corporativos em nome da prefeitura?`;
		builder.Prompts.choice(
			session, currentQuestion,
			[Yes, No],
			{
				listStyle: builder.ListStyle.button,
				retryPrompt: `${retryPrompts.request}\n\n${currentQuestion}`,
			} // eslint-disable-line comma-dangle
		);
	},
	(session, args) => {
		answers.questionNumber++; // in case of interruptions
		switch (args.response.entity) {
		case Yes:
			answers.answer4 = 0;
			break;
		default: // No
			answers.answer4 = 1;
			itens.push('<p> - Disponibilização das despesas realizadas com cartões corporativos em nome da prefeitura</p>');
			break;
		}
		session.beginDialog('/questionFive');
	},
]).cancelAction('cancelAction', '', {
	matches: /^cancel$|^cancelar$|^voltar$|^in[íi]cio$|^começar/i,
});

library.dialog('/questionFive', [
	(session) => {
		saveSession.updateSession(session.userData.userid, session,	{ answers, user });
		currentQuestion =	`${answers.questionNumber} - O portal de transparência disponibiliza os valores referentes às verbas de representação,` +
		'de gabinete e reembolsáveis de qualquer natureza?';
		builder.Prompts.choice(
			session, currentQuestion,
			[Yes, No],
			{
				listStyle: builder.ListStyle.button,
				retryPrompt: `${retryPrompts.request}\n\n${currentQuestion}`,
			} // eslint-disable-line comma-dangle
		);
	},
	(session, args) => {
		answers.questionNumber++; // in case of interruptions
		switch (args.response.entity) {
		case Yes:
			answers.answer5 = 0;
			break;
		default: // No
			answers.answer5 = 1;
			itens.push('<p> - Disponibilização dos valores referentes às verbas de representação, de gabinete e reembolsáveis de qualquer natureza</p>');
			break;
		}
		session.beginDialog('/questionSix');
	},
]).cancelAction('cancelAction', '', {
	matches: /^cancel$|^cancelar$|^voltar$|^in[íi]cio$|^começar/i,
});

library.dialog('/questionSix', [
	(session) => {
		saveSession.updateSession(session.userData.userid, session,	{ answers, user });
		currentQuestion = `${answers.questionNumber} - O portal de transparência disponibiliza os editais de licitação, dos procedimentos licitatórios, ` +
		'com indicação das licitações abertas, em andamento e já realizadas, dos contratos e aditivos, e dos convênios celebrados?';
		builder.Prompts.choice(
			session, currentQuestion,
			[Yes, No],
			{
				listStyle: builder.ListStyle.button,
				retryPrompt: `${retryPrompts.request}\n\n${currentQuestion}`,
			} // eslint-disable-line comma-dangle
		);
	},
	(session, args) => {
		answers.questionNumber++; // in case of interruptions
		switch (args.response.entity) {
		case Yes:
			answers.answer6 = 0;
			break;
		default: // No
			answers.answer6 = 1;
			itens.push('<p> - Disponibilização dos editais de licitação, dos procedimentos licitatórios, com indicação das licitações abertas,' +
			' em andamento e já realizadas, dos contratos e aditivos, e dos convênios celebrados</p>');
			break;
		}
		session.beginDialog('/questionSeven');
	},
]).cancelAction('cancelAction', '', {
	matches: /^cancel$|^cancelar$|^voltar$|^in[íi]cio$|^começar/i,
});

library.dialog('/questionSeven', [
	(session) => {
		saveSession.updateSession(session.userData.userid, session,	{ answers, user });
		currentQuestion = `${answers.questionNumber} - O portal de transparência realiza a disponibilização da íntegra dos procedimentos de dispensa e ` +
		'inexigibilidade de licitações, com respectivas fundamentações?';
		builder.Prompts.choice(
			session, currentQuestion,
			[Yes, No],
			{
				listStyle: builder.ListStyle.button,
				retryPrompt: `${retryPrompts.request}\n\n${currentQuestion}`,
			} // eslint-disable-line comma-dangle
		);
	},
	(session, args) => {
		answers.questionNumber++; // in case of interruptions
		switch (args.response.entity) {
		case Yes:
			answers.answer7 = 0;
			break;
		default: // No
			answers.answer7 = 1;
			itens.push('<p> - Disponibilização da íntegra dos procedimentos de dispensa e inexigibilidade de licitações, ' +
			'com respectivas fundamentações</p>');
			break;
		}
		session.beginDialog('/questionEight');
	},
]).cancelAction('cancelAction', '', {
	matches: /^cancel$|^cancelar$|^voltar$|^in[íi]cio$|^começar/i,
});

library.dialog('/questionEight', [
	(session) => {
		saveSession.updateSession(session.userData.userid, session,	{ answers, user });
		session.send(`Ufa! Não desanime, parceiro. Faltam apenas ${14 - answers.questionNumber} perguntas para finalizar seu pedido. ${emoji.get('wink')}`);
		currentQuestion = `${answers.questionNumber} - O portal de transparência realiza a disponibilização do controle de estoque da prefeitura, ` +
		'com lista de entradas e saídas de bens patrimoniais, além da relação de cessões, permutas e doação de bens?';
		builder.Prompts.choice(
			session, currentQuestion,
			[Yes, No],
			{
				listStyle: builder.ListStyle.button,
				retryPrompt: `${retryPrompts.request}\n\n${currentQuestion}`,
			} // eslint-disable-line comma-dangle
		);
	},
	(session, args) => {
		answers.questionNumber++; // in case of interruptions
		switch (args.response.entity) {
		case Yes:
			answers.answer8 = 0;
			break;
		default: // No
			answers.answer8 = 1;
			itens.push('<p>-Disponibilização do controle de estoque da prefeitura, com lista de entradas' +
		' e saídas de bens patrimoniais,além da relação de cessões, permutas e doação de bens</p>');
			break;
		}
		session.beginDialog('/questionNine');
	},
]).cancelAction('cancelAction', '', {
	matches: /^cancel$|^cancelar$|^voltar$|^in[íi]cio$|^começar/i,
});

library.dialog('/questionNine', [
	(session) => {
		saveSession.updateSession(session.userData.userid, session,	{ answers, user });
		currentQuestion = `${answers.questionNumber} - O portal de transparência realiza a disponibilização das notas-fiscais eletrônicas ` +
		'que deram origem a pagamentos?';
		builder.Prompts.choice(
			session, currentQuestion,
			[Yes, No],
			{
				listStyle: builder.ListStyle.button,
				retryPrompt: `${retryPrompts.request}\n\n${currentQuestion}`,
			} // eslint-disable-line comma-dangle
		);
	},
	(session, args) => {
		answers.questionNumber++; // in case of interruptions
		switch (args.response.entity) {
		case Yes:
			answers.answer9 = 0;
			break;
		default: // No
			answers.answer9 = 1;
			itens.push('<p> - Disponibilização das notas-fiscais eletrônicas que deram origem a pagamentos</p>');
			break;
		}
		session.beginDialog('/questionTen');
	},
]).cancelAction('cancelAction', '', {
	matches: /^cancel$|^cancelar$|^voltar$|^in[íi]cio$|^começar/i,
});

library.dialog('/questionTen', [
	(session) => {
		saveSession.updateSession(session.userData.userid, session,	{ answers, user });
		currentQuestion = `${answers.questionNumber} - O portal de transparência realiza a disponibilização do plano plurianual; ` +
		'da lei de diretrizes orçamentárias; da lei orçamentária?';
		builder.Prompts.choice(
			session, currentQuestion,
			[Yes, No],
			{
				listStyle: builder.ListStyle.button,
				retryPrompt: `${retryPrompts.request}\n\n${currentQuestion}`,
			} // eslint-disable-line comma-dangle
		);
	},
	(session, args) => {
		answers.questionNumber++; // in case of interruptions
		switch (args.response.entity) {
		case Yes:
			answers.answer10 = 0;
			break;
		default: // No
			answers.answer10 = 1;
			itens.push('<p> - Disponibilização do plano plurianual; da lei de diretrizes orçamentárias; da lei orçamentária</p>');
			break;
		}
		session.beginDialog('/questionEleven');
	},
]).cancelAction('cancelAction', '', {
	matches: /^cancel$|^cancelar$|^voltar$|^in[íi]cio$|^começar/i,
});

library.dialog('/questionEleven', [
	(session) => {
		saveSession.updateSession(session.userData.userid, session,	{ answers, user });
		currentQuestion = `${answers.questionNumber} - O portal de transparência realiza a disponibilização dos relatórios Resumido de Execução Orçamentária; ` +
					'Relatórios de Gestão Fiscal; Atas das Audiências Públicas de Avaliação de Metas Fiscais, com a abordagem das seguintes questões: ' +
					' 		\n\ni) Demonstrativo de Aplicação na Área de Educação;' +
					'			\n\nii) Demonstrativo de Aplicação na Área de Saúde;' +
					'			\n\niii) Demonstrativo de Aplicação na Área Social?';
		builder.Prompts.choice(
			session, currentQuestion,
			[Yes, No],
			{
				listStyle: builder.ListStyle.button,
				retryPrompt: `${retryPrompts.request}\n\n${currentQuestion}`,
			} // eslint-disable-line comma-dangle
		);
	},
	(session, args) => {
		answers.questionNumber++; // in case of interruptions
		switch (args.response.entity) {
		case Yes:
			answers.answer11 = 0;
			break;
		default: // No
			answers.answer11 = 1;
			itens.push('<p> - Disponibilização dos relatórios Resumido de Execução Orçamentária; Relatórios de Gestão Fiscal; ' +
			' Atas das Audiências Públicas de Avaliação de Metas Fiscais, com a abordagem das seguintes questões:' +
			'	\n\ni) Demonstrativo de Aplicação na Área de Educação;' +
			'	\n\nii) Demonstrativo de Aplicação na Área de Saúde;' +
			'	\n\niii) Demonstrativo de Aplicação na Área Social');
			break;
		}
		session.beginDialog('/questionTwelve');
	},
]).cancelAction('cancelAction', '', {
	matches: /^cancel$|^cancelar$|^voltar$|^in[íi]cio$|^começar/i,
});

library.dialog('/questionTwelve', [
	(session) => {
		saveSession.updateSession(session.userData.userid, session,	{ answers, user });
		currentQuestion = `${answers.questionNumber} - O portal de transparência realiza a disponibilização dos extratos de conta única?`;
		builder.Prompts.choice(
			session, currentQuestion,
			[Yes, No],
			{
				listStyle: builder.ListStyle.button,
				retryPrompt: `${retryPrompts.request}\n\n${currentQuestion}`,
			} // eslint-disable-line comma-dangle
		);
	},
	(session, args) => {
		answers.questionNumber++; // in case of interruptions
		switch (args.response.entity) {
		case Yes:
			answers.answer12 = 0;
			break;
		default: // No
			answers.answer12 = 1;
			itens.push('<p> - Disponibilização dos extratos de conta única</p>');
			break;
		}
		session.beginDialog('/questionThirteen');
	},
]).cancelAction('cancelAction', '', {
	matches: /^cancel$|^cancelar$|^voltar$|^in[íi]cio$|^começar/i,
});

library.dialog('/questionThirteen', [
	(session) => {
		saveSession.updateSession(session.userData.userid, session,	{ answers, user });
		currentQuestion = `${answers.questionNumber} - O portal de transparência realiza a disponibilização das despesas em um único arquivo em formato ` +
		'legível por máquina incluindo as colunas: função, subfunção, programa, ação, valor liquidado e valor empenhado?';
		builder.Prompts.choice(
			session, currentQuestion,
			[Yes, No],
			{
				listStyle: builder.ListStyle.button,
				retryPrompt: `${retryPrompts.request}\n\n${currentQuestion}`,
			} // eslint-disable-line comma-dangle
		);
	},
	(session, args) => {
		answers.questionNumber++; // in case of interruptions
		switch (args.response.entity) {
		case Yes:
			answers.answer13 = 0;
			break;
		default: // No
			answers.answer13 = 1;
			itens.push('<p> - Disponibilização das despesas em um único arquivo em formato legível por máquina incluindo as colunas:' +
			' função, subfunção, programa, ação, valor liquidado e valor empenhado\n\n</p>');
			break;
		}
		// checks if users full name alrealdy exists
		User.findOne({
			attributes: ['name'],
			where: { fb_id: session.userData.userid },
		}).then((userData) => {
			answers.requesterName = userData.name;
			if (userData.name === 'undefined' || userData.name === null || userData.name === '') {
				session.beginDialog('/askFullName');
			} else {
				session.beginDialog('/generateRequest');
			}
		}).catch(() => {
			session.beginDialog('/askFullName');
		});
	},
]).cancelAction('cancelAction', '', {
	matches: /^cancel$|^cancelar$|^voltar$|^in[íi]cio$|^começar/i,
});

library.dialog('/askFullName', [
	(session) => {
		saveSession.updateSession(session.userData.userid, session);
		builder.Prompts.text(session, `Qual é o seu nome completo? ${emoji.get('memo')}`);
	},
	(session) => {
		// session.message.text = comes from customAction
		answers.requesterName = session.message.text.split('/').join(''); // stops user from entering '/' and breaking the file creation
		User.update({
			name: answers.requesterName,
		}, {
			where: {
				fb_id: session.userData.userid,
			},
			returning: true,
		}).then(() => {
			console.log('User name updated sucessfuly');
		}).catch((err) => {
			console.log(err);
			throw err;
		}).finally(() => {
			session.beginDialog('/generateRequest');
		});
	},
]).customAction({
	matches: /^[\w]+/, // override main customAction at app.js
	onSelectAction: (session) => {
		if (/^cancel$|^cancelar$|^voltar$|^in[íi]cio$|^come[cç]ar/i.test(session.message.text)) {
			session.replaceDialog(session.userData.session); // cancel option
		} else {
			session.userData.userDoubt = session.message.text;
			session.endDialog();
		}
	},
});

library.dialog('/generateRequest', [
	(session) => {
		saveSession.updateSession(session.userData.userid, session);
		// style config that will be used for the html creation
		const styleDiv = 'font-size:12pt;margin-left:1.5em;margin-right:1.5em;margin-bottom:0.5em;margin-top:2.0em';
		const html = `<p style="${styleDiv}">Eu, ${answers.requesterName}, com fundamento na Lei 12.527, de 18 de novembro de 2011,` +
		' de 27 de maio de 2009, venho por meio deste pedido solicitar o acesso às seguintes informações, ' +
		' e na Lei Complementar 131, que devem ser disponibilizadas com periodicidade diária ou mensal (quando aplicável) em' +
		` página oficial na internet desde o momento em que a Lei Complementar 131/2009 passou a vigorar:</p><div style="${styleDiv}">${itens.join('')}` +
		`</div><div style="${styleDiv}"><p>Caso a disponibilização desde a vigência da Lei Complementar 131/2009 não seja possível,` +
		' solicito que a impossibilidade de apresentação de informações seja motivada, sob pena de responsabilidade, ' +
		' e que a série histórica mais longa disponível à Prefeitura das informações seja disponibilizada em página oficial na internet ' +
		' e que acompanhe a resposta a esta solicitação.</p></div>';

		pdf.create(html).toStream((err, stream) => {
			const pdfFile = stream.pipe(fs.createWriteStream(`/tmp/${answers.requesterName}_LAI.pdf`));
			file = pdfFile.path;

			// TODO is this question necessary?
			builder.Prompts.choice(
				session,
				'Legal! Acabamos! Vamos gerar seu pedido?',
				[HappyYes],
				{
					listStyle: builder.ListStyle.button,
					retryPrompt: retryPrompts.choice,
				} // eslint-disable-line comma-dangle
			);
		});
		itens.length = 0;
	},

	(session, args, next) => {
		switch (args.response.entity) {
		default: // Doesn't matter what happens here
			next();
			break;
		}
	},

	(session) => {
		let data = generatedRequest.loadSync(path, file.slice(5));
		data = JSON.stringify(data);
		// Uploading the generated PDF to MailChimp
		const dataString = `{"name":"${answers.requesterName}_LAI.pdf" , "file_data":${data}}`;

		const options = {
			url: apiUri,
			method: 'POST',
			headers,
			body: dataString,
			auth: {
				user: apiUser,
				pass: apiKey,
			},
		};

		function callback(error, response, body) {
			if (!error || response.statusCode === 200) {
				const obj = JSON.parse(body);
				console.log(obj.full_size_url);
				const msg = new builder.Message(session);
				msg.sourceEvent({
					facebook: {
						attachment: {
							type: 'template',
							payload: {
								template_type: 'generic',
								elements: [
									{
										title: `Pedido de acesso à informação gerado pelo Guaxi para ${answers.requesterName}`,
										buttons: [{
											type: 'web_url',
											url: obj.full_size_url,
											title: 'Ver seu pedido',
										}],
									},
								],
							},
						},
					},
				});
				session.send(msg);

				UserMission.update(
					{ metadata: { request_generated: 1 } },
					{
						where: {
							user_id: user.id,
							mission_id: 2,
							completed: false,
						},
						returning: true,
						raw: true,
					} // eslint-disable-line comma-dangle
				).then((missionData) => {
					// TODO alinhas comportamento desejado (salvar todos os protocolos gerados?)
					// creates request in user_information_acess_request
					infoRequest.create({ // saves the request generated
						user_id: user.id,
						metadata: answers,
						isMission: true,
						missionID: missionData[1][0].id,
					}).then(() => {
						console.log('Mission/Request created successfully! :)');
					}).catch((errRequest) => {
						console.log(`Couldn't save request :( -> ${errRequest})`);
					});
					console.log(`Mission ${missionData[1][0].id} updated successfully`);
					session.send(`Aeee!! Conseguimos! Demorou, mas chegamos ao final. ${emoji.get('sweat_smile')}`);
					session.send('Muito bem! Agora basta protocolar o pedido de acesso à informação no portal de transparência de sua prefeitura, ' +
						'ou levar esse pedido em formato físico e protocola-lo.' +
						'\n\nNo entanto, o poder público tem um tempo limite de 20 dias para responder o seu pedido.');
					session.send(`E precisamos dessa resposta para completar nossa ação. ${emoji.get('page_facing_up')}`);
					builder.Prompts.choice(
						session,
						`Quando puder concluir nosso processo, volte em 'Gerar Pedido'  e responda as questões. ${emoji.get('wink')}`,
						[goBack],
						{
							listStyle: builder.ListStyle.button,
							retryPrompt: retryPrompts.choice,
						} // eslint-disable-line comma-dangle
					);
				}).catch((err) => {
					console.log(`Error updating mission${err}`);
					session.send('Oooops...Tive um problema ao atualizar sua missão. Tente novamente mais tarde.');
					session.endDialogWithResult({ resumed: builder.ResumeReason.notCompleted });
					throw err;
				});
			}
		}

		request(options, callback);
		fs.unlink(file);

		Notification.update({
			// sentAlready == true and timeSent == null
			// means that no message was sent, because there was no need to
			sentAlready: true,
		}, {
			where: {
				userID: user.id,
				missionID: 2,
			},
		}).then(() => {
			console.log('Notification Updated! This message will not be sent!');
		}).catch((err) => { console.log(`Couldn\t update Notification => ${err}! This message will be sent!`); });

		Notification.findOrCreate({
			where: { // checks if exists
				missionID: 3,
				userID: user.id,
			},
			defaults: {
				missionID: 3, // mission 2 and lone request are beign treated the same way
				userID: user.id,
				msgSent: 'Olá, parceiro! Detectei que você conseguiu gerar um pedido de acesso a informação.' +
				'\nVocê poderia me responder algumas perguntinhas?',
			},
		}).then(() => {
			console.log('Added a new notification 3 to be sent!');
		}).catch((errNotification) => {
			console.log(`Couldn't save notification 3 :( -> ${errNotification})`);
		});
	},

	(session, args) => {
		switch (args.response.entity) {
		default: // GoBack
			session.replaceDialog('*:/getStarted');
		}
	},
]).cancelAction('cancelAction', '', {
	matches: /^cancel$|^cancelar$|^voltar$|^in[íi]cio$|^começar/i,
});

module.exports = library;
