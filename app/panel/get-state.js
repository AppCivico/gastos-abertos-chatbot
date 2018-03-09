/* global builder:true */
// Check how many users are in a state

const library = new builder.Library('byState');

const fs = require('fs');
const request = require('request');
const csvWriter = require('csv-write-stream');
const Base64File = require('js-base64-file');

const writer = csvWriter();
const generatedRequest = new Base64File();
const path = '';
const file = 'guaxi_usuarios_by_estado.csv';

const apiUri = process.env.MAILCHIMP_API_URI;
const apiUser = process.env.MAILCHIMP_API_USER;
const apiKey = process.env.MAILCHIMP_API_KEY;

const headers = {
	'content-type': 'application/json',
};

const User = require('../server/schema/models').user;

const arrayData = []; // data from users found using userState

library.dialog('/', [
	(session, args, next) => {
		User.findAndCountAll({
			attributes: ['fb_name', 'state', 'city', 'receiveMessage', 'group'],
			order: [['createdAt', 'DESC']], // order by last recorded interation with bot
			// admin: {
			// 	$eq: false, // we're not counting admins as users
			// },
			// },
		}).then((listUser) => {
			if (listUser.count === 0) {
				session.send('Não temos ninguém salvo? Melhor entrar em contato com o suporte!');
				session.endDialog();
			} else {
				let count = 1;
				writer.pipe(fs.createWriteStream(file));
				session.send(`Encontrei ${listUser.count} usuário(s).`);
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
		let data = generatedRequest.loadSync(file);
		data = JSON.stringify(data);
		const dataString = `{"name":"guaxi_usuarios_by_estado.csv", "file_data":${data}}`;

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
				console.dir(body);
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
										title: 'Arquivo gerado com os dados dos usuários',
										buttons: [{
											type: 'web_url',
											url: obj.full_size_url,
											title: 'Baixar seu CSV',
										}],
									},
								],
							},
						},
					},
				});
				session.send(msg);
			} else {
				session.send('Tive um problema. Contate a equipe!');
				session.endDialog();
			}
		}

		writer.end();
		request(options, callback);
		fs.unlink(file);
	},
	(session) => {
		session.send('sdfsd');
	},
]);

module.exports = library;
