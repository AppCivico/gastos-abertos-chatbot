/* global bot:true builder:true */

const library = new builder.Library('addAdmin');

const User = require('./server/schema/models').user;

const Confirm = 'Adicionar';
const Negate = 'Não adicionar/Voltar';

let userName = '';
let userGroup;
let FacebookId;

library.dialog('/', [
	(session) => {
		session.send('Esse é o menu para adicionar usuários que ' +
		'já interagiram com o bot como administrador e adicionar/mudar o grupo.' +
		'\nAdicione os dados e depois confirme os dados.');
		builder.Prompts.text(session, 'Digite o ID do usuario a ser adicionado.\n\n' +
		'Você pode descobrir o id usando essa ferramenta: https://findmyfbid.com/, ' +
		'basta copiar e colar a url do perfil da pessoa.');
	},
	(session, args) => {
		FacebookId = args.response;
		User.findOne({
			attributes: ['fb_name'],
			where: {
				fb_id: FacebookId,
			},
		}).then((userData) => {
			userName = userData.fb_name;
			builder.Prompts.text(session, `Encontrei '${userData.fb_name}' com esse ID. ` +
		'\n\nDigite a que grupo esse usuário irá pertencer.');
		}).catch((err) => {
			session.send('Não consegui encontrar nenhum usuário com esse ID! ' +
			'Ou talvez aconteceu um erro mais grave, que seria bom reportar para os responsáveis.');
			console.log(`Error finding user => ${err}`);
			session.replaceDialog('*:/promptButtons');
		});
	},
	(session, args) => {
		// Response => Lower Case => Capitalize only the first letter of each word
		userGroup = args.response.toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
		builder.Prompts.choice(
			session, `Deseja adicionar ${userName} como administrador no grupo ${userGroup}?`,
			[Confirm, Negate],
			{
				listStyle: builder.ListStyle.button,
				retryPrompt: 'Por favor, utilize os botões',
			} // eslint-disable-line comma-dangle
		);
	},

	(session, result) => {
		if (result.response) {
			switch (result.response.entity) {
			case Confirm:
				User.update({
					admin: true,
					// group : userGroup, // TODO
				}, {
					where: {
						fb_id: FacebookId,
					},
				}).then(() => {
					session.send('Usuário adicionado com sucesso!');
				}).catch(() => {
					session.send('Ops. Ocorreu um erro. Tente novamente mais tarde ou reporte esse erro.');
				}).finally(() => {
					session.replaceDialog('*:/promptButtons');
				});
				break;
			default: // Negate
				session.endDialog();
				break;
			}
		}
	},
]);

module.exports = library;
