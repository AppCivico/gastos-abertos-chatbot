/* global builder:true */
// A menu for admins to add users to groups

const library = new builder.Library('addGroup');
const retryPrompts = require('../misc/speeches_utils/retry-prompts');

const User = require('../server/schema/models').user;

const Confirm = 'Atualizar';
const Cancel = 'Cancelar/Voltar';

let userName = ''; // fb_name to search for => later, this var stores selected user
let userGroup = ''; // group to add user in
let lastIndex = 0;
const arrayName = []; // data from users found using userName
const arrayGroup = []; // store groups from the users above

library.dialog('/', [
	(session) => {
		arrayName.length = 0; // empty array
		session.send('Esse é o menu para adicionar usuários que já interagiram com o bot a algum grupo, ' +
		'dando-lhe permissão para mandar mensagens diretas para os usuários em nome do grupo! O usuário não se tornará administrador.');
		builder.Prompts.text(session, 'Insira o nome do perfil, escolha na lista e confirme.');
	},
	(session, args, next) => {
		userName = args.response;

		User.findAndCountAll({ // list all users with desired like = fb_name
			attributes: ['fb_name', 'group'],
			order: [['updatedAt', 'DESC']], // order by last recorded interation with bot
			limit: 7,
			where: {
				fb_name: {
					$iLike: `%${userName}%`, // case insensitive
				},
				fb_id: { // excludes whoever is adding admin
					$ne: session.userData.userid,
				},
			},
		}).then((listUser) => {
			if (listUser.count === 0) {
				session.send('Não foi encontrado nenhum usuário com esse nome!');
				session.endDialog();
			} else {
				session.send(`Encontrei ${listUser.count} usuário(s).`);
				listUser.rows.forEach((element) => {
					arrayName.push(element.dataValues.fb_name);
					arrayGroup.push(element.dataValues.group);
				});
				next();
			}
		}).catch((err) => {
			session.send(`Ocorreu um erro ao pesquisar usuários => ${err}`);
			session.endDialog();
		});
	},
	(session) => {
		arrayName.push(Cancel); // adds Cancel button
		lastIndex = arrayName.length;
		builder.Prompts.choice(
			session, 'Clique no nome completo desejado abaixo. Os nomes estão ordenados na ordem de ' +
			'quem interagiu com o bot mais recentemente(limitando a 7 opções). Você poderá cancelar com a última opção. ', arrayName,
			{
				listStyle: builder.ListStyle.button,
				retryPrompt: retryPrompts.addAdmin,
				maxRetries: 10,
			} // eslint-disable-line comma-dangle
		);
	},

	(session, result) => {
		session.sendTyping();
		// changed the role of variable below, now it stores the name of user selected
		userName = result.response.entity;
		if (result.response) {
			if (result.response.index === (lastIndex - 1)) { // check if user chose 'Cancel'
				session.endDialog();
			} else {
				session.send(`Esse usuário pertence ao grupo: ${arrayGroup[result.response.index]}`);
				builder.Prompts.text(session, `A qual grupo ${userName} pertencerá?`);
			}
		} else {
			session.send('Obs. Parece que a opção não foi selecionada corretamente. Tente novamente.');
			session.endDialog();
		}
	},
	(session, results) => {
		// Response => Lower Case => Capitalize only the first letter of each word
		userGroup = results.response.toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
		builder.Prompts.choice(
			session, `Deseja adicionar ${userName} no grupo ${userGroup}? Ele receberá o direito de mandar mensagens diretas para o usuário!`,
			[Confirm, Cancel],
			{
				listStyle: builder.ListStyle.button,
				retryPrompt: retryPrompts.addAdmin,
				maxRetries: 10,
			} // eslint-disable-line comma-dangle
		);
	},
	(session, result) => {
		if (result.response) {
			switch (result.response.entity) {
			case Confirm:
				User.update({
					group: userGroup,
					sendMessage: true,
				}, {
					where: {
						fb_name: {
							$eq: userName,
						},
					},
				}).then(() => {
					session.send(`${userName} foi adicionado ao grupo ${userGroup}!`);
				}).catch((err) => {
					session.send(`Não foi possível adicionar ${result.response.entity} em ${userGroup} => ${err}`);
				}).finally(() => {
					session.endDialog();
				});
				break;
			default: // Cancel
				session.endDialog();
				break;
			}
		}
	},
]);

module.exports = library;
