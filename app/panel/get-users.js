/* global builder:true */
// Check how many users are in a state

const library = new builder.Library('csvUser');

const fs = require('fs');
const request = require('request');

const Base64File = require('js-base64-file');

const generatedRequest = new Base64File();
const path = './';
let file = '';

const apiUri = process.env.MAILCHIMP_API_URI;
const apiUser = process.env.MAILCHIMP_API_USER;
const apiKey = process.env.MAILCHIMP_API_KEY;

const User = require('../server/schema/models').user;

library.dialog('/', [
	(session, args, next) => {
		file = 'temp_guaxi_usuario.csv';
		User.findAndCountAll({
			attributes: ['id', 'fb_name', 'name', 'state', 'city', 'receiveMessage', 'group', 'createdAt', 'updatedAt'],
			order: [['id', 'ASC']],
			// admin: {
			// 	$eq: false, // we're not counting admins as users
			// },
		}).then((listUser) => {
			if (listUser.count === 0) {
				session.send('Não encontrei ninguém. Não temos ninguém salvo? Melhor entrar em contato com o suporte!');
				session.endDialog();
			} else {
				let count = 0;
				session.send(`Encontrei ${listUser.count} usuário(s). Estou montando o arquivo`);
				session.sendTyping();
				fs.writeFileSync(file, 'Número,ID,Nome Facebook,Nome Cadastrado,Estado,Município,Recebe Mensagem,Grupo,Criado em,Última Interação\n');
				listUser.rows.forEach((element) => {
					fs.appendFileSync(file, `${++count},` + // eslint-disable-line no-plusplus
					`${element.dataValues.id}, ${element.dataValues.fb_name},${element.dataValues.name}, ${element.dataValues.state},` +
					`${element.dataValues.city}, ${element.dataValues.receiveMessage}, ${element.dataValues.group}, ` +
					`${element.dataValues.createdAt}, ${element.dataValues.updatedAt}\n`);

					// this block will be executed last
					if (count === listUser.rows.length) {
						next();
					}
				});
			}
		}).catch((err) => {
			session.send(`Ocorreu um erro ao pesquisar usuários => ${err}`);
			session.endDialog();
		});
	},
	(session, args, next) => {
		let data = generatedRequest.loadSync('', file);
		data = JSON.stringify(data);
		const dataString = `{"name":"${Math.floor(Date.now() / 1000)}_guaxi_users.csv" , "file_data":${data}}`;

		const options = {
			url: apiUri,
			method: 'POST',
			'content-type': 'application/json',
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
										title: 'CSV com as informações',
										buttons: [{
											type: 'web_url',
											url: obj.full_size_url,
											title: 'Baixar CSV',
										}],
									},
								],
							},
						},
					},
				});
				session.send(msg);
				session.endDialog();
			} else {
				session.send(`Ocorreu um erro => ${error}`);
				session.endDialog();
			}
		}
		request(options, callback);
		fs.unlink(path + file);
	},
]);

module.exports = library;
