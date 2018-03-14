/* global builder:true */
// Check how many users are in a state

const library = new builder.Library('csvUser');

const fs = require('fs');
const request = require('request');
const csvWriter = require('csv-write-stream');

const Base64File = require('js-base64-file');

const generatedRequest = new Base64File();
const path = '/tmp/';
let file = '';
let writer;

const apiUri = process.env.MAILCHIMP_API_URI;
const apiUser = process.env.MAILCHIMP_API_USER;
const apiKey = process.env.MAILCHIMP_API_KEY;

const headers = {
	'content-type': 'application/json',
};

const User = require('../server/schema/models').user;

library.dialog('/', [
	(session, args, next) => {
		writer = csvWriter();
		file = 'guaxi_usuario.csv';
		User.findAndCountAll({
			attributes: ['fb_name', 'name', 'state', 'city', 'receiveMessage', 'group'],
			order: [['createdAt', 'DESC']], // order by last recorded interation with bot
			// admin: {
			// 	$eq: false, // we're not counting admins as users
			// },
		}).then((listUser) => {
			if (listUser.count === 0) {
				session.send('Não encontrei ninguém. Não temos ninguém salvo? Melhor entrar em contato com o suporte!');
				session.endDialog();
			} else {
				let count = 0;
				writer.pipe(fs.createWriteStream(path + file));
				session.send(`Encontrei ${listUser.count} usuário(s).`);
				listUser.rows.forEach((element) => {
					writer.write({
						Número: ++count, // eslint-disable-line no-plusplus
						'Nome no Facebook': element.dataValues.fb_name,
						'Nome cadastrado': element.dataValues.name,
						Estado: element.dataValues.state,
						Município: element.dataValues.city,
						'Recebe Mensagem': element.dataValues.receiveMessage,
						Grupo: element.dataValues.group,
					});

					// this block will be executed last
					if (count === listUser.rows.length) {
						writer.end();
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
		const dataString = `{"name":"${Math.floor(Date.now() / 1000)}_user_guaxi.csv" , "file_data":${data}}`;

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
										title: 'CSV com informações dos usuários',
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
				next();
			}
		}
		request(options, callback);
		fs.unlink(path + file);
	},
]);

module.exports = library;
