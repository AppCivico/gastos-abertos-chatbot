/* global builder:true */
// A menu for admins to remove old admins

const library = new builder.Library('removeAdmin');
const retryPrompts = require('../misc/speeches_utils/retry-prompts');

const User = require('../server/schema/models').user;

const Cancel = 'Cancelar/Voltar';

const arrayData = []; // data from users found using userName
let lastIndex = 0;

library.dialog('/', [
	(session, args, next) => {
		arrayData.length = 0; // empty array
		session.send('Esse é o menu para removermos usuários que são adiministradores do seu papel de adiministrador , ' +
		'tirando-lhes as permissões para adicionar mais administradores e grupos.' +
		'\n\nEles ainda poderão mandar mensagem direta aos usuários! Você não está listado.');
		User.findAndCountAll({ // list all users with desired like = fb_name
			attributes: ['fb_name'],
			order: [['updatedAt', 'DESC']], // order by last recorded interation with bot
			limit: 10,
			where: {
				admin: {
					$eq: true,
				},
				fb_id: { // excludes whoever is adding admin
					$ne: session.userData.userid,
				},
			},
		}).then((listAdmin) => {
			if (listAdmin.count === 0) {
				session.send('Não foi encontrado nenhum outro administrador, além de você!');
				session.endDialog();
			} else {
				session.send(`Encontrei ${listAdmin.count} administrador(es).`);
				listAdmin.rows.forEach((element) => {
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
			'quem interagiu com o bot mais recentemente(limitando a 10 opções). Você poderá cancelar com a última opção. ', arrayData,
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
					admin: false,
				}, {
					where: {
						fb_name: {
							$eq: result.response.entity,
						},
					},
				}).then(() => {
					session.send(`${result.response.entity} foi removido de seu papel de administrador!`);
				}).catch((err) => {
					session.send(`Não foi possível remover ${result.response.entity} de seu papel de administrador => ${err}`);
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
