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
let numberResults;

const apiUri = process.env.MAILCHIMP_API_URI;
const apiUser = process.env.MAILCHIMP_API_USER;
const apiKey = process.env.MAILCHIMP_API_KEY;

const User = require('../server/schema/models').user;
const LAIRequest = require('../server/schema/models').user_information_access_request;
const UserMission = require('../server/schema/models').user_mission;

library.dialog('/', [
	(session, args, next) => {
		User.findAndCountAll({
			attributes: ['id', 'fb_name', 'name', 'state', 'city', 'receiveMessage', 'group', 'createdAt', 'updatedAt', 'admin', 'fb_id'],
			order: [['createdAt', 'ASC']],
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
						'ID do Facebook': element.dataValues.fb_id,
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
	(session, args, next) => {
		let data = generatedRequest.loadSync('', file);
		data = JSON.stringify(data);
		const dataString = `{"name":"${timestamp('YYYYMMDDmmss')}_guaxi_users.csv" , "file_data":${data}}`;
		// console.log(dataString);
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
				// console.log(`\nURL: ${obj.full_size_url}`);
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
				next();
			} else {
				session.send(`Ocorreu um erro ao gerar o CSV => ${error}`);
				next();
			}
		}
		request(options, callback);
		fs.unlink(`./${file}`);
	},
	(session, args, next) => {
		numberResults = 'Dados relevantes:\n\n';
		UserMission.count({
			where: {
				mission_id: {	$eq: 1 },
				completed: { $eq: true },
			},
		}).then((MissionData) => {
			numberResults += `Avaliações de portal: ${MissionData}\n\n`;
		}).catch((err) => {
			session.send(`Ocorreu um erro => ${err}`);
		}).finally(() => {
			next();
		});
	},
	(session, args, next) => {
		UserMission.count({
			where: {
				mission_id: {	$eq: 1 },
				completed: { $eq: false	},
			},
		}).then((MissionData) => {
			numberResults += `Avaliações começadas mas não concluídas: ${MissionData}\n\n`;
		}).catch((err) => {
			session.send(`Ocorreu um erro => ${err}`);
		}).finally(() => {
			next();
		});
	},
	(session, args, next) => {
		UserMission.count({
			where: {
				mission_id: { $eq: 2 },
				completed: { $eq: true },
			},
		}).then((MissionData) => {
			numberResults += `Pedidos protocolados: ${MissionData}\n\n`;
		}).catch((err) => {
			session.send(`Ocorreu um erro => ${err}`);
		}).finally(() => {
			next();
		});
	},
	(session, args, next) => {
		LAIRequest.count({
		}).then((LAIData) => {
			numberResults += `Pedidos gerados: ${LAIData}\n\n`;
		}).catch((err) => {
			session.send(`Ocorreu um erro => ${err}`);
		}).finally(() => {
			next();
		});
	},
	(session, args, next) => {
		// A Leader is whoever finished the first mission or started the second mission
		UserMission.count({
			distinct: true,
			col: 'user_id',
			where: {
				$or: [
					{ mission_id: { $eq: 2 } },
					{ mission_id: { $eq: 1 }, completed: { $eq: true } },
				],
			},
		}).then((MissionData) => {
			numberResults += `Líderes: ${MissionData}\n\n`;
		}).catch((err) => {
			session.send(`Ocorreu um erro => ${err}`);
		}).finally(() => {
			next();
		});
	},
	(session, args, next) => {
		UserMission.count({
			where: {
				mission_id: { $eq: 2 },
				completed: { $eq: false },
			},
		}).then((MissionData) => {
			numberResults += `Pedidos começados mas não concluídos: ${MissionData}\n\n`;
		}).catch((err) => {
			session.send(`Ocorreu um erro => ${err}`);
		}).finally(() => {
			next();
		});
	},
	(session, args, next) => {
		User.count({
			where: {
				receiveMessage: { $eq: true },
			},
		}).then((MissionData) => {
			numberResults += `Quantos recebem mensagem de embaixador: ${MissionData}\n\n`;
		}).catch((err) => {
			session.send(`Ocorreu um erro => ${err}`);
		}).finally(() => {
			next();
		});
	},
	(session, args, next) => {
		User.count({
			where: {
				$or: [
					// null means we couldn't ask the user yet but we'll send the message anyway
					{ receiveMessage: null },
					// true means the user accepted receiving messages
					{ receiveMessage: true },
				],
			},
		}).then((MissionData) => {
			numberResults += `Quantos recebem mensagem de administrador: ${MissionData}\n\n`;
		}).catch((err) => {
			session.send(`Ocorreu um erro => ${err}`);
		}).finally(() => {
			next();
		});
	},
	(session) => {
		User.count({
			distinct: true,
			col: 'fb_id',
			where: {
				sendMessage: { $eq: true },
			},
		}).then((MissionData) => {
			numberResults += `Quantos embaixadores: ${MissionData}\n\n`;
		}).catch((err) => {
			session.send(`Ocorreu um erro => ${err}`);
		}).finally(() => {
			session.send(numberResults);
			session.send('Obs: Um líder é quem terminou a primeira missão ou começou a segunda.');
			session.endDialog();
		});
	},
]);

module.exports = library;
