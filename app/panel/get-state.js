/* global builder:true */
// Check how many users are in a state

const library = new builder.Library('byState');

const fs = require('fs');
const csvWriter = require('csv-write-stream');

const writer = csvWriter();

const retryPrompts = require('../misc/speeches_utils/retry-prompts');
const User = require('../server/schema/models').user;

const Cancel = 'Cancelar/Voltar';

let userState = ''; // fb_name to search for
const arrayData = []; // data from users found using userState

library.dialog('/', [
	(session) => {
		arrayData.length = 0; // empty array
		session.beginDialog('validators:state', {
			prompt: 'Digite as iniciais de um estado para podermos pesquisar quantas pessoas existem nele.',
			retryPrompt: retryPrompts.state,
			maxRetries: 10,
		});
	},
	(session, args, next) => {
		userState = args.response.toUpperCase();

		User.findAndCountAll({ // list all users from state
			attributes: ['fb_name', 'state', 'city', 'receiveMessage', 'group'],
			order: [['createdAt', 'DESC']], // order by last recorded interation with bot
			where: {
				state: {
					$eq: userState,
				},
				// admin: {
				// 	$eq: false, // we're not counting admins as users
				// },
			},
		}).then((listUser) => {
			if (listUser.count === 0) {
				session.send(`Não encontramos nenhum usuário em ${userState}.`);
				session.endDialog();
			} else {
				let count = 1;
				writer.pipe(fs.createWriteStream('guaxi_usuarios_by_estado.csv'));
				session.send(`Encontrei ${listUser.count} usuário(s) em ${userState}.`);
				listUser.rows.forEach((element) => {
					arrayData.push(element.dataValues.fb_name);
					writer.write({
						Número: count++, // eslint-disable-line no-plusplus
						'Nome no Facebook': element.dataValues.fb_name,
						Estado: element.dataValues.state,
						Município: element.dataValues.city,
						'Recebe Mensagem': element.dataValues.receiveMessage,
						Grupo: element.dataValues.group,
					});
				});
				next();
			}
		}).catch((err) => {
			session.send(`Ocorreu um erro ao pesquisar usuários => ${err}`);
			session.endDialog();
		});
	},
	(session) => {
		writer.end();
		arrayData.push(Cancel); // adds Cancel button
		builder.Prompts.choice(
			session, 'São eles:', arrayData,
			{
				listStyle: builder.ListStyle.list,
				retryPrompt: retryPrompts.addAdmin,
				maxRetries: 10,
			} // eslint-disable-line comma-dangle
		);
	},

	(session) => {
		session.sendTyping();
		session.send('Beleza, então!');
		session.endDialog();
	},
]);

module.exports = library;
