/* global  bot:true builder:true */
/* eslint no-param-reassign: ["error", { "props": true, "ignorePropertyModificationsFor":
["session"] }] */

bot.library(require('./contact'));

// TODO a questão do google-spredsheet
// const GoogleSpreadsheet = require('google-spreadsheet');
// var doc = new GoogleSpreadsheet(process.env.GOOGLE_SPREADSHEET_ID);
// const async = require('async');
// let sheet;
const User = require('../server/schema/models').user;

const retryPrompts = require('../misc/speeches_utils/retry-prompts');
const mailer = require('../server/mailer/mailer.js');
const emoji = require('node-emoji');

const Contact = 'Entrar em contato';
const Restart = 'Voltar ao início';
let fbId = '';

const library = new builder.Library('gameSignUp');

library.dialog('/', [
	(session) => {
		session.sendTyping();
		session.send(`Tenho o maior respeito pela sua privacidade e tomarei todo cuidado com seus dados. ${emoji.get('zipper_mouth_face')} ` +
		'Se tiver dúvidas, confira os termos de uso do Gastos Abertos: https://gastosabertos.org/termos .');
		session.send('Agora vou te fazer algumas perguntas para seu cadastro, ok? São só 7 perguntinhas...');
		builder.Prompts.text(session, `Qual é o seu nome completo? ${emoji.get('memo')}`);
	},
	(session, args) => {
		session.dialogData.fullName = args.response;
		session.sendTyping();
		session.beginDialog('validators:email', {
			prompt: `Qual é o seu e-mail? ${emoji.get('email')}`,
			retryPrompt: retryPrompts.email,
			maxRetries: 10,
		});
	},
	(session, args) => {
		if (args.resumed) {
			session.sendTyping();
			session.send('Você tentou inserir um e-mail inválido muitas vezes. Tente novamente mais tarde.');
			session.endDialogWithResult({ resumed: builder.ResumeReason.notCompleted });
			return;
		}

		session.dialogData.email = args.response;
		session.sendTyping();

		User.count({
			where: {
				email: session.dialogData.email,
			},
		})
			.then((count) => {
				if (count !== 0) {
					session.send(`Você já está cadastrado, parceiro! ${emoji.get('sunglasses')} Verifique se você recebeu minha mensagem em seu e-mail. ` +
					` \n\n\nEla foi enviada para o e-mail: ${session.dialogData.email}.`);
					session.endDialog();
					// session.beginDialog('/welcomeBack');
				} else {
					session.sendTyping();
					session.beginDialog('validators:date', {
						prompt: `Qual é a sua data de nascimento? Por exemplo, a minha é 13/07/2017. ${emoji.get('calendar')}`,
						retryPrompt: retryPrompts.date,
						maxRetries: 10,
					});
				}
			});
	},
	(session, args) => {
		if (args.resumed) {
			session.sendTyping();
			session.send('Você tentou inserir uma data inválida muitas vezes. Tente novamente mais tarde.');
			session.endDialogWithResult({ resumed: builder.ResumeReason.notCompleted });
			return;
		}

		session.dialogData.birthDate = args.response;
		session.sendTyping();
		session.beginDialog('validators:state', {
			prompt: `Qual é o estado(sigla) que você mora? ${emoji.get('flag-br')}`,
			retryPrompt: retryPrompts.state,
			maxRetries: 10,
		});
	},
	(session, args) => {
		if (args.resumed) {
			session.sendTyping();
			session.send('Você tentou inserir um estado inválido muitas vezes. Tente novamente mais tarde.');
			session.endDialogWithResult({ resumed: builder.ResumeReason.notCompleted });
			return;
		}

		session.dialogData.state = args.response;
		session.sendTyping();
		builder.Prompts.text(session, `Qual é o município que você representará? ${emoji.get('cityscape')}`);
	},
	(session, args) => {
		session.dialogData.city = args.response;
		session.sendTyping();
		session.send('Ufa! Não desanime, parceiro. Faltam apenas 2 perguntas para finalizar sua inscrição. ' +
			`Vamos lá! ${emoji.get('slightly_smiling_face').repeat(2)}`);
		session.beginDialog('validators:cellphone', {
			prompt: `Qual é o seu número de telefone celular? Não esqueça de colocar o DDD. Por exemplo: 11987654321 ${emoji.get('iphone')}`,
			retryPrompt: retryPrompts.cellphone,
			maxRetries: 10,
		});
	},

	(session, args) => {
		if (args.resumed) {
			session.sendTyping();
			session.send('Você tentou inserir um número de telefone celular inválido muitas vezes. Tente novamente mais tarde.');
			session.endDialogWithResult({ resumed: builder.ResumeReason.notCompleted });
			return;
		}
		session.dialogData.cellphoneNumber = args.response;
		session.sendTyping();
		builder.Prompts.text(session, `Qual a sua profissão? ${emoji.get('construction_worker')}`);
	},
	(session, args) => {
		session.dialogData.occupation = args.response;

		if (session.message.address.channelId === 'facebook') {
			fbId = session.message.sourceEvent.sender.id;
		}
		// TODO fix Error creating user
		// Unhandled rejection SequelizeValidationError: string violation:
		// email cannot be an array or an object

		const user = {
			name: session.dialogData.fullName,
			email: session.dialogData.email,
			birth_date: session.dialogData.birthDate,
			state: session.dialogData.state,
			city: session.dialogData.city,
			cellphone_number: session.dialogData.cellphoneNumber,
			occupation: session.dialogData.occupation,
		};

		User.create({
			name: user.name,
			email: user.email,
			birth_date: user.birth_date,
			state: user.state,
			city: user.city,
			cellphone_number: user.cellphone_number,
			occupation: user.occupation,
			fb_id: fbId,
		})
			.then(() => {
				console.log('User created sucessfully');

				mailer.listofemails.push(session.dialogData.email);
				mailer.massMailer();
				//
				// async.series([
				//     //Comment this whole block if you're not feeding a Google Spreadsheet
				//     function setAuth(step)  {
				//         // This is where you insert your JSON credentials file
				//         var creds = require('./Gastos-abertos-spreadsheet-b1c4c355e003.json');
				//         doc.useServiceAccountAuth(creds, step);
				//     },
				//
				//     function addEntry(step) {
				//         doc.addRow(process.env.GOOGLE_WORKSHEET_ID, user, function(err, row) {
				//             step();
				//         });
				//     }
				// ]);
				session.send(`Muito bom, parceiro! Vamos te enviar em email confirmando. ${emoji.get('tada').repeat(2)}`);
				session.send(`Convide mais pessoas para participar do Gastos Abertos. ${emoji.get('busts_in_silhouette').repeat(3)}` +
				'\n\n\nCompartilhe nosso link: https://www.facebook.com/messages/t/gastosabertos.\n\n\nAté a próxima missão!');

				builder.Prompts.choice(
					session,

					'Posso te ajudar com mais alguma coisa?',
					[Contact, Restart],
					{
						listStyle: builder.ListStyle.button,
						retryPrompt: retryPrompts.choice,
					} // eslint-disable-line comma-dangle
				);
			})
			.catch((e) => {
				console.log('Error creating user');
				session.send('Oooops...Tive um problema ao criar seu cadastro. Tente novamente mais tarde.');
				session.endDialogWithResult({ resumed: builder.ResumeReason.notCompleted });
				throw e;
			});
	},
	(session, args) => {
		switch (args.response.entity) {
		case Contact:
			session.beginDialog('contact:/');
			break;
		default: // Restart
			session.endDialog();
			break;
		}
	},
]).cancelAction('cancelAction', '', {
	matches: /^cancel$|^cancelar$|^desisto/i,
});

module.exports = library;
