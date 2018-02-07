/* global  bot:true builder:true */
/* eslint no-plusplus: 0 */

bot.library(require('./contact'));

const request = require('request');
const pdf = require('html-pdf');
const fs = require('fs');
const Base64File = require('js-base64-file');
const emoji = require('node-emoji');

const retryPrompts = require('../misc/speeches_utils/retry-prompts');
// const User = require('../server/schema/models').user;
const UserMission = require('../server/schema/models').user_mission;
const infoRequest = require('../server/schema/models').user_information_access_request;

const library = new builder.Library('informationAccessRequest');

const Generate = 'Gerar Pedido';
const Denial = 'Ainda não';
const Yes = 'Sim';
const No = 'Não';
const HappyYes = 'Vamos lá!';
const Contact = 'Entrar em contato';
const goBack = 'Voltar para o início';
let currentQuestion = ''; // repeats the current question after/if the retry.prompt is activated
let questionNumber; // shows the question number in each question(disabled no-plusplus for this)

let user;
// antigo user_mission, mudou para se encaixar na regra 'camel-case' e UserMission já existia
let missionUser;

// 0 means the item isn't included in the request
const answers = {
	requesterName: '',
	resourceLocation: '0',
	individualRemuneration: '0',
	dailyPayments: '0',
	expensesCityHall: '0',
	expensesCards: '0',
	refundableValue: '0',
	biddingEdicts: '0',
	biddingEditals: '0',
	expenseProcedures: '0',
	stockControl: '0',
	eletronicInvoice: '0',
	multiannualPlan: '0',
	abridgedReports: '0',
	singleExtract: '0',
	expensesFile: '0',
};

const itens = [];

let options = {
	border: {
		top: '5em',
		right: '3.5em',
		bottom: '3.5em',
		left: '3em',
	},

	'font-size': '10px',
};

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
	(session, args) => {
		if (args && args.user && args.user_mission) {
			user = args.user; // eslint-disable-line prefer-destructuring
			missionUser = args.user_mission; // eslint-disable-line prefer-destructuring
			answers.requesterName = user.name;
			session.send('Esse é um processo bem extenso e tem bastante conteúdo.' +
				`Caso você tenha qualquer tipo de dúvidas nos mande! ${emoji.get('writing_hand')} ` +
			'\n\nO grupo de lideranças é muito bom para isso! (https://chat.whatsapp.com/Flm0oYPVLP0KfOKYlUidXS)');
			session.send('Além disso, você pode a qualquer momento digitar \'cancelar\' e eu te levo para o início');
		} else {
			session.send('Você está gerando um pedido de acesso à informação, que poderá ser encaminhado a prefeitura de seu ' +
			'município quando estão faltando informações nos portais de transparência.');
		}
		// else if (session.message.address.channelId == 'facebook' && !args) {
		// 		var fbId = session.message.sourceEvent.sender.id;

		// 		User.findOne({
		// 				where: {
		// 						email: email,
		// 						fb_id: fbId
		// 				}
		// 		}).then(User => {
		// 				user = User.dataValues;

		// 				builder.Prompts.choice(session,
		// 						user.name + "você está gerando um ",
		// 						[Yes, No],
		// 						{
		// 								listStyle: builder.ListStyle.button,
		// 								retryPrompt: retryPrompts.choice
		// 						} // eslint-disable-line comma-dangle
		// 				);

		// 		});
		// }

		session.beginDialog('/looseRequest');
	},
]).cancelAction('cancelAction', '', {
	matches: /^cancel$|^cancelar$|^voltar$|^in[íi]cio$|^desisto/i,
});

library.dialog('/looseRequest', [
	(session) => {
		questionNumber = 1; // reseting value
		session.sendTyping();
		session.send('Irei te perguntar se o site permite que você identifique todos os seguintes itens:' +
						'\n\n\n - Qual o número do processo que deu origem aquele gasto;' +
						'\n\n\n - O bem fornecido ou o serviço prestado ao seu município;' +
						'\n\n\n - Pessoa física ou jurídica beneficiária do pagamento;' +
						'\n\n\n - E, quando for o caso, o procedimento licitatório realizado.');
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
			session.send(`Legal! Boa sorte! ${emoji.get('v').repeat(3)} `);
			currentQuestion = `${questionNumber++} - Seu município identifica de onde vêm os recursos que ele recebe? ` +
			'\n- ele tem que identificar, pelo menos, se os recursos vêm da União, do estado, da cobrança de impostos ou de empréstimos.';
			builder.Prompts.choice(
				session, currentQuestion,
				[Yes, No],
				{
					listStyle: builder.ListStyle.button,
					retryPrompt: `${retryPrompts.request}\n\n${currentQuestion}`,
				} // eslint-disable-line comma-dangle
			);
			break;
		default: // Denial
			session.send(`Okay! Eu estarei aqui esperando para começarmos! ${emoji.get('wave').repeat(2)}`);
			session.endDialog();
			break;
		}
	},

	(session, args) => {
		switch (args.response.entity) {
		case Yes:
			break;
		default: // No
			answers.resourceLocation = 1;
			itens.push('<p> - Disponibilização sobre receitas, despesas e endividamento público, nos termos da Lei Complementar 131, ' +
			'de 27 de maio de 2009, e demais regras aplicáveis;</p>');
			break;
		}

		currentQuestion = `${questionNumber++} - O portal de transparência disponibiliza dados referentes a remuneração de ` +
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
		switch (args.response.entity) {
		case Yes:
			break;
		default: // No
			answers.individualRemuneration = 1;
			itens.push('<p> - Disponibilização sobre remuneração de cada um dos agentes públicos, ' +
			'individualizada – o modelo do Portal da Transparência do Governo Federal é um exemplo;</p>');
			break;
		}

		currentQuestion = `${questionNumber++} - O portal de transparência disponibiliza: a relação de pagamentos de diárias, ` +
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
		switch (args.response.entity) {
		case Yes:
			break;
		default: // No
			answers.dailyPayments = 1;
			itens.push('<p> - Disponibilização da relação de pagamentos de diárias, aquisição de passagens aéreas (destino e motivo da viagem) ' +
			'e adiantamento de despesas</p>');
			break;
		}

		currentQuestion = `${questionNumber++} - O portal de transparência disponibiliza as despesas realizadas com cartões corporativos em nome da prefeitura?`;
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
		switch (args.response.entity) {
		case Yes:
			break;
		default: // No
			answers.expensesCityHall = 1;
			itens.push('<p> - Disponibilização das despesas realizadas com cartões corporativos em nome da prefeitura</p>');
			break;
		}

		currentQuestion =	`${questionNumber++} - O portal de transparência disponibiliza os valores referentes às verbas de representação,` +
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
		switch (args.response.entity) {
		case Yes:
			break;
		default: // No
			answers.refundableValue = 1;
			itens.push('<p> - Disponibilização dos valores referentes às verbas de representação, de gabinete e reembolsáveis de qualquer natureza</p>');
			break;
		}

		currentQuestion = `${questionNumber++} - O portal de transparência disponibiliza os editais de licitação, dos procedimentos licitatórios, com indicação das ` +
		'licitações abertas, em andamento e já realizadas, dos contratos e aditivos, e dos convênios celebrados?';
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
		switch (args.response.entity) {
		case Yes:
			break;
		default: // No
			answers.biddingEdicts = 1;
			itens.push('<p> - Disponibilização dos editais de licitação, dos procedimentos licitatórios, com indicação das licitações abertas,' +
			' em andamento e já realizadas, dos contratos e aditivos, e dos convênios celebrados</p>');
			break;
		}

		currentQuestion = `${questionNumber++} - O portal de transparência realiza a disponibilização da íntegra dos procedimentos de dispensa e ` +
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
		switch (args.response.entity) {
		case Yes:
			break;
		default: // No
			answers.expenseProcedures = 1;
			itens.push('<p> - Disponibilização da íntegra dos procedimentos de dispensa e inexigibilidade de licitações, ' +
			'com respectivas fundamentações</p>');
			break;
		}
		session.send(`Ufa! Não desanime, parceiro. Faltam apenas ${14 - questionNumber} perguntas para finalizar seu pedido. ${emoji.get('wink')}`);
		currentQuestion = `${questionNumber++} - O portal de transparência realiza a disponibilização do controle de estoque da prefeitura, ` +
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
		switch (args.response.entity) {
		case Yes:
			break;
		default: // No
			answers.stockControl = 1;
			itens.push('<p>-Disponibilização do controle de estoque da prefeitura, com lista de entradas' +
		' e saídas de bens patrimoniais,além da relação de cessões, permutas e doação de bens</p>');
			break;
		}

		currentQuestion = `${questionNumber++} - O portal de transparência realiza a disponibilização das notas-fiscais eletrônicas ` +
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
		switch (args.response.entity) {
		case Yes:
			break;
		default: // No
			answers.eletronicInvoice = 1;
			itens.push('<p> - Disponibilização das notas-fiscais eletrônicas que deram origem a pagamentos</p>');
			break;
		}

		currentQuestion = `${questionNumber++} - O portal de transparência realiza a disponibilização do plano plurianual; ` +
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
		switch (args.response.entity) {
		case Yes:
			break;
		default: // No
			answers.multiannualPlan = 1;
			itens.push('<p> - Disponibilização do plano plurianual; da lei de diretrizes orçamentárias; da lei orçamentária</p>');
			break;
		}

		currentQuestion = `${questionNumber++} - O portal de transparência realiza a disponibilização dos relatórios Resumido de Execução Orçamentária; ` +
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
		switch (args.response.entity) {
		case Yes:
			break;
		default: // No
			answers.abridgedReports = 1;
			itens.push('<p> - Disponibilização dos relatórios Resumido de Execução Orçamentária; Relatórios de Gestão Fiscal; ' +
			' Atas das Audiências Públicas de Avaliação de Metas Fiscais, com a abordagem das seguintes questões:' +
			'	\n\ni) Demonstrativo de Aplicação na Área de Educação;' +
			'	\n\nii) Demonstrativo de Aplicação na Área de Saúde;' +
			'	\n\niii) Demonstrativo de Aplicação na Área Social');
			break;
		}

		currentQuestion = `${questionNumber++} - O portal de transparência realiza a disponibilização dos extratos de conta única?`;
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
		switch (args.response.entity) {
		case Yes:
			break;
		default: // No
			answers.singleExtract = 1;
			itens.push('<p> - Disponibilização dos extratos de conta única</p>');
			break;
		}

		currentQuestion = `${questionNumber++} - O portal de transparência realiza a disponibilização das despesas em um único arquivo em formato ` +
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

	(session, args, next) => {
		switch (args.response.entity) {
		case Yes:
			break;
		default: // No
			answers.expensesFile = 1;
			itens.push('<p> - Disponibilização das despesas em um único arquivo em formato legível por máquina incluindo as colunas:' +
			' função, subfunção, programa, ação, valor liquidado e valor empenhado\n\n</p>');
			break;
		}
		questionNumber = 1;
		if (!user) {
			builder.Prompts.text(session, `Qual é o seu nome completo? ${emoji.get('memo')}`);
		}
		next();
	},

	(session, args) => {
		if (!user) {
			answers.requesterName = args.response;
		}

		const html = `<p style="font-size:7pt">Eu, ${answers.requesterName}, com fundamento na Lei 12.527, de 18 de novembro de 2011, e na Lei Complementar 131,` +
			' de 27 de maio de 2009, venho por meio deste pedido solicitar o acesso às seguintes informações, ' +
			' que devem ser disponibilizadas com periodicidade diária ou mensal (quando aplicável) em página oficial na internet desde o momento ' +
			`em que a Lei Complementar 131/2009 passou a vigorar:</p><div style="font-size:7pt"">${itens.join('')}` +
			'</div><div style="font-size:7pt"><p>Caso a disponibilização desde a vigência da Lei Complementar 131/2009 não seja possível,' +
			' solicito que a impossibilidade de apresentação de informações seja motivada, sob pena de responsabilidade, ' +
			' e que a série histórica mais longa disponível à Prefeitura das informações seja disponibilizada em página oficial na internet ' +
			' e que acompanhe a resposta a esta solicitação.</p></div>';

		pdf.create(html).toStream((err, stream) => {
			const pdfFile = stream.pipe(fs.createWriteStream(`/tmp/${answers.requesterName}LAI.pdf`));
			file = pdfFile.path;

			builder.Prompts.choice(
				session,
				'Muito bem! Acabamos! Vamos gerar seu pedido?',
				[HappyYes],
				{
					listStyle: builder.ListStyle.button,
					retryPrompt: retryPrompts.choice,
				} // eslint-disable-line comma-dangle
			);
		});

		itens.length = 0;
	},

	(session, args) => {
		switch (args.response.entity) {
		case HappyYes:
			session.beginDialog('/generateRequest');
			break;
		default: // Unhappy
			session.send('Ocorreu um erro.');
			break;
		}
	},
]).cancelAction('cancelAction', '', {
	matches: /^cancel$|^cancelar$|^voltar$|^in[íi]cio$|^desisto/i,
});

library.dialog('/generateRequest', [
	(session) => {
		let data = generatedRequest.loadSync(path, file.slice(5));
		data = JSON.stringify(data);
		// Uploading the generated PDF to MailChimp
		const dataString = `{"name":"${answers.requesterName}LAI.pdf" , "file_data":${data}}`;

		options = {
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
			// TODO teste
			// if (error) {
			// 	const obj = 'testeteste';
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

				if (user && missionUser) {
					UserMission.update(
						{ metadata: { request_generated: 1 } },
						{
							where: {
								user_id: user.id,
								mission_id: 2,
								completed: false,
							},
							returning: true,
						} // eslint-disable-line comma-dangle
					)
						.then((result) => {
							// saves request in user_information_acess_request
							infoRequest.create({
								user_id: user.id,
								metadata: answers,
							}).then(() => {
								console.log('Request saved successfully! :)');
							}).catch((err) => {
								console.log(`Couldn't save request :( -> ${err})`);
							});

							console.log(`${result} Mission updated successfully`);
							session.send(`Aeee!! Conseguimos! Demorou, mas chegamos ao final. ${emoji.get('sweat_smile')}`);
							session.send('Muito bem! Agora basta protocolar o pedido de acesso à informação no portal de transparência de sua prefeitura, ' +
							'ou levar esse pedido em formato físico e protocola-lo.');
							session.send('No entanto, o poder público tem um tempo limite de 20 dias para responder o seu pedido.');
							session.send(`E precisamos dessa resposta para completar nossa segunda missão. ${emoji.get('page_facing_up')}`);
							builder.Prompts.choice(
								session,
								`Então, pode ficar tranquilo que te chamo quando for liberada a conclusão. ${emoji.get('wink')}`,
								[Contact, goBack],
								{
									listStyle: builder.ListStyle.button,
									retryPrompt: retryPrompts.choice,
								} // eslint-disable-line comma-dangle
							);
						})
						.catch((err) => {
							console.log(`Error updating mission${err}`);
							session.send('Oooops...Tive um problema ao atualizar sua missão. Tente novamente mais tarde.');
							session.endDialogWithResult({ resumed: builder.ResumeReason.notCompleted });
							throw err;
						});
				} else {
					builder.Prompts.choice(
						session,
						'Muito bem! Agora basta protocolar o pedido de acesso à informação no portal de transparência de sua prefeitura, ' +
						'ou levar esse pedido em formato físico e protocolizá-lo. Você pode também nos contatar para tirar alguma dúvida ou ' +
						'relatar suas ações.',
						[Contact, goBack],
						{
							listStyle: builder.ListStyle.button,
							retryPrompt: retryPrompts.choice,
						} // eslint-disable-line comma-dangle
					);
				}
			}
		}
		request(options, callback);
		fs.unlink(file);
	},

	(session, args) => {
		switch (args.response.entity) {
		case Contact:
			session.replaceDialog('contact:/');
			break;
		default: // Contact
			session.endDialog();
		}
	},
]).cancelAction('cancelAction', '', {
	matches: /^cancel$|^cancelar$|^voltar$|^in[íi]cio$|^desisto/i,
});


module.exports = library;
