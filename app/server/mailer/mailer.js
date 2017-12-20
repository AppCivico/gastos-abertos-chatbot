const emailQueue = require('../schema/models').email_queue;
const async = require('async');
// const http = require('http');
const nodemailer = require('nodemailer');

const mailer = (function aa() {
	const self = {};

	const listofemails = [];

	const successEmail = [];

	const failureEmail = [];

	let transporter;

	self.massMailer = () => {
		transporter = nodemailer.createTransport({
			service: 'SMTP',
			host: process.env.SMTP_SERVER,
			port: process.env.SMTP_PORT,
			auth: {
				user: process.env.SMTP_USERNAME,
				pass: process.env.SMTP_PASSWORD,
			},
			tls: { rejectUnauthorized: false },
			debug: true,
		});

		self.invokeOperation();
	};

	self.invokeOperation = () => {
		async.each(listofemails, self.SendEmail, () => {
			console.log(successEmail);
			console.log(failureEmail);
		});
	};

	self.SendEmail = (Email, callback) => {
		self.status = false;

		async.waterfall([
			function (callback) {
				const mailOptions = {
					from: 'Guaxi <no_reply@gastosabertos.org>',
					to: Email,
					subject: 'Guaxi - Recebi sua inscrição com sucesso!',
					html: 'Olá!<br><br>Eu, Guaxi, vi que você se inscreveu para o segundo ciclo do processo de missões do Gastos Abertos.' +
					'<br><br>Em breve um membro da equipe do Gastos Abertos irá entrar em contato através do e-mail que você cadastrou.' +
					'<br><br>Muito obrigado, parceiro!',
				};
				listofemails.pop(Email);
				transporter.sendMail(mailOptions, (error, info) => {
					if (error) {
						console.log(error);
						failureEmail.push(Email);
					} else {
						self.status = true;
						successEmail.push(Email);
					}
					callback(null, self.status, Email);
				});
			},
			function (statusCode, Email, callback) {
				console.log(`Will update DB here for ${Email}With ${statusCode}`);
				emailQueue.create({
					email: listofemails,
					sucess: successEmail ? successEmail[0] : failureEmail[0],
				})
					.then((emailQueue) => {
						console.log('DB updated sucessfully');
						return emailQueue;
					})
					.catch((e) => {
						console.log('Error creating user');
						throw e;
					});
				callback();
			},
		], () => {
			callback();
		});
	};

	self.listofemails = listofemails;

	return self;
}());

module.exports = mailer;
