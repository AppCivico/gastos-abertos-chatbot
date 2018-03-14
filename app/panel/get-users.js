/* global builder:true */
// Sends a download link to a csv with useful inforation

const library = new builder.Library('csvUser');

const fs = require('fs');
const request = require('request');
const csvWriter = require('csv-write-stream');
const csvReader = require('fast-csv');
const Base64File = require('js-base64-file');

const usersFile = new Base64File();

const path = `${__dirname}/`;
let file = '';
let writer;
let csvData = [];
let dataString;

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
		file = `${Math.floor(Date.now() / 1000)}_user_guaxi.csv`;
		User.findAndCountAll({
			attributes: ['id', 'fb_name', 'name', 'state', 'city', 'receiveMessage', 'group', 'createdAt', 'updatedAt'],
			order: [['id', 'ASC']], // order by last recorded interation with bot
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
						ID: element.dataValues.id,
						'Nome no Facebook': element.dataValues.fb_name,
						'Nome cadastrado': element.dataValues.name,
						Estado: element.dataValues.state,
						Município: element.dataValues.city,
						'Recebe Mensagem': element.dataValues.receiveMessage,
						Grupo: element.dataValues.group,
						'Criado em': element.dataValues.createdAt,
						'Última Interação': element.dataValues.updatedAt,
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
		fs.createReadStream(path + file)
			.pipe(csvReader())
			.on('data', (data) => {
				console.log(data);
				csvData.push(data);
			})
			.on('end', () => {
				console.log(`Finished reading csv data => ${file}`);
				csvData = Buffer.from(csvData).toString('base64');
				csvData = JSON.stringify(csvData);
				next();
			});
	},
	(session, args, next) => {
		// console.log(`csvData:${csvData}`);
		// csvData = usersFile.loadSync(path, file);
		// console.log(`csvData2:${csvData}`);
		// csvData = JSON.stringify(csvData);
		// console.log(`csvData3:${csvData}`);

		dataString = `{"name":${file} , "file_data":${csvData}}`;
		console.dir(dataString);

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
				console.log(obj);
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
			} else {
				console.log(error);
				console.log(response.statusCode);
				console.log(response.statusMessage);
				next();
			}
		}
		console.log('Executando request...');
		request(options, callback);
	},
	(session) => {
		fs.unlink(path + file, () => {
			session.endDialog();
		});
	},
]);

module.exports = library;
