/* global bot:true builder:true */

const library = new builder.Library('sendMessage');

const User = require('../server/schema/models').user;

function sendProactiveMessage(address, customMessage) {
	const msg = new builder.Message().address(address);
	msg.text(customMessage);
	msg.textLocale('pt-BR');
	bot.send(msg);
}

library.dialog('/', [
	(session) => {
		session.send('Este é o menu para mandarmos mensagens para todos os usuários que aceitaram receber mensagens!');
		User.findAll({
			attributes: ['fb_name', 'address'],
			where: {
				address: {
					$ne: null,
				},
			},
		})
			.then((user) => {
				// console.log(`usereeeeeeee: ${Object.entries(user[0])}`);
				// console.log(`usereeeeeeee: ${user[0].dataValues}`);
				// console.log(`usereeeeeeee: ${Object.entries(user[0].dataValues)}`);

				user.forEach((element) => {
					sendProactiveMessage(element.dataValues.address, `Olá, ${element.dataValues.fb_name}, essa é uma mensagem proativa de teste.`);
				});
				//	sendProactiveMessage(JSON.parse(adra), 'Mensagem proativa');
			}).catch((err) => {
				session.send('Ocorreu um erro ao enviar mensagem');
				console.log(`Erro ao enviar mensagem: ${err}`);
			});
	},
	(session) => {
		session.endDialog();
	},
]);

module.exports = library;
