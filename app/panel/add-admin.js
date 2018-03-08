/* global builder:true */
// A menu for admins to add new admins

const library = new builder.Library('addAdmin');
const retryPrompts = require('../misc/speeches_utils/retry-prompts');

const User = require('../server/schema/models').user;

const Cancel = 'Cancelar/Voltar';

let userName = ''; // fb_name to search for
const arrayData = []; // data from users found using userName
let lastIndex = 0;

library.dialog('/', [
	(session) => {
		arrayData.length = 0; // empty array
		session.send('Esse é o menu para adicionar usuários que já interagiram com o bot ao grupo de administradores, ' +
		'dando-lhe permissão para adicionar mais administradores, grupos e mandar mensagems.' +
		'\nInsira o nome do perfil, escolha na lista e confirme. Por padrão, a pessoa será inserida no grupo AppCívico.');
		// TODO admin que volta pro menu inicial volta pro grupo AppCívico
		builder.Prompts.text(session, 'Digite o nome do usuario a ser adicionado para iniciarmos a pesquisa. ' +
		'\n\nQuem já é administrador não será listado!');
	},
	(session, args, next) => {
		userName = args.response;

		User.findAndCountAll({ // list all users with desired like = fb_name
			attributes: ['fb_name'],
			order: [['updatedAt', 'DESC']], // order by last recorded interation with bot
			limit: 7,
			where: {
				fb_name: {
					$iLike: `%${userName}%`, // case insensitive
				},
				admin: {
					$eq: false,
				},
				fb_id: { // excludes whoever is adding admin
					$ne: session.userData.userid,
				},
			},
		}).then((listUser) => {
			if (listUser.count === 0) {
				session.send('Não foi encontrado nenhum usuário com esse nome! Será que ele já é administrador?');
				session.endDialog();
			} else {
				session.send(`Encontrei ${listUser.count} usuário(s).`);
				listUser.rows.forEach((element) => {
					arrayData.push(element.dataValues.fb_name);
				});
				next();
			}
		}).catch((err) => {
			session.send(`Ocorreu um erro ao pesquisar usuários => ${err}`);
			session.endDialog();
		});
	},
	(session) => {
		console.log(arrayData);
		arrayData.push(Cancel); // adds Cancel button
		lastIndex = arrayData.length;
		builder.Prompts.choice(
			session, 'Clique no nome completo desejado abaixo. Os nomes estão ordenados na ordem de ' +
			'quem interagiu com o bot mais recentemente(limitando a 7 opções). Você poderá cancelar com a última opção. ', arrayData,
			{
				listStyle: builder.ListStyle.button,
				retryPrompt: retryPrompts.addAdmin,
				maxRetries: 10,
			} // eslint-disable-line comma-dangle
		);
	},

	(session, result) => {
		session.sendTyping();
		if (result.response) {
			if (result.response.index === (lastIndex - 1)) { // check if user chose 'Cancel'
				session.endDialog();
			} else {
				User.update({
					admin: true,
					group: 'AppCívico',
				}, {
					where: {
						fb_name: {
							$eq: result.response.entity,
						},
					},
				}).then(() => {
					session.send(`${result.response.entity} foi adicionado como administrador! Seu grupo agora é 'AppCívico'`);
				}).catch((err) => {
					session.send(`Não foi possível adicionar ${result.response.entity} em administrador => ${err}`);
				}).finally(() => {
					session.endDialog();
				});
			}
		} else {
			session.send('Obs. Parece que a opção não foi selecionada corretamente. Tente novamente.');
			session.endDialog();
		}
	},
]);

module.exports = library;
