/* global builder:true */
// Generate a CSV with user information

const library = new builder.Library('csvUser');

const request = require('request');
const fs = require('fs');
const Base64File = require('js-base64-file');
const csv = require('fast-csv');
const timestamp = require('time-stamp');

const file = 'guaxi_usuario_temp.csv';
const generatedRequest = new Base64File();
let csvStream;
let writableStream;

const apiUri = process.env.MAILCHIMP_API_URI;
const apiUser = process.env.MAILCHIMP_API_USER;
const apiKey = process.env.MAILCHIMP_API_KEY;

const User = require('../server/schema/models').user;

library.dialog('/', [
	(session, args, next) => {
		User.findAndCountAll({
			attributes: ['id', 'fb_name', 'name', 'state', 'city', 'receiveMessage', 'group', 'createdAt', 'updatedAt', 'admin'],
			order: [['id', 'ASC']],
		}).then((listUser) => {
			if (listUser.count === 0) {
				session.send('Não encontrei ninguém. Não temos ninguém salvo? Melhor entrar em contato com o suporte!');
				session.endDialog();
			} else {
				csvStream = csv.createWriteStream({ headers: true });
				writableStream = fs.createWriteStream(file);
				csvStream.pipe(writableStream);

				let count = 0;
				session.send(`Encontrei ${listUser.count} usuário(s). Estou montando o arquivo`);
				session.sendTyping();
				listUser.rows.forEach((element) => {
					csvStream.write({
						Número: ++count, // eslint-disable-line no-plusplus
						ID: element.dataValues.id,
						'Nome no Facebook': element.dataValues.fb_name,
						'Nome Cadastrado': element.dataValues.name,
						Estado: element.dataValues.state,
						Município: element.dataValues.city,
						'Recebe Mensagens': element.dataValues.receiveMessage,
						Grupo: element.dataValues.group,
						'Criado em': element.dataValues.createdAt,
						'Última Interação': element.dataValues.updatedAt,
						'É administrador': element.dataValues.admin,
					});

					// this block will be executed last
					if (count === listUser.rows.length) {
						writableStream.on('finish', () => {
							console.log('Done writing file.');
							next();
						});
						csvStream.end();
					}
				});
			}
		}).catch((err) => {
			session.send(`Ocorreu um erro ao pesquisar usuários => ${err}`);
			session.endDialog();
		});
	},
	(session) => {
		let data = generatedRequest.loadSync('', file);
		data = JSON.stringify(data);
		const dataString = `{"name":"${timestamp('YYYYMMDDmmss')}_guaxi_users.csv" , "file_data":${data}}`;
		console.log(dataString);
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
				console.log(`\nURL: ${obj.full_size_url}`);
				const msg = new builder.Message(session);
				msg.sourceEvent({
					facebook: {
						attachment: {
							type: 'template',
							payload: {
								template_type: 'generic',
								elements: [
									{
										title: 'O CSV está pronto! :)',
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
		fs.unlink(`./${file}`);
	},
]);

module.exports = library;
