/* global bot:true builder:true */
// A class for adding a timer to the missions and sending warning messages

const UserMission = require('./server/schema/models').user_mission;
const User = require('./server/schema/models').user;

// console.log(`dasd:${new Date(Date.now() - limit)}`);

function sendWarning(user) {
	const msg = new builder.Message().address(user.address);
	msg.textLocale('pt-BR');
	msg.text('Percebemos que você não terminou um de nossos processos.\n\nSe precisar de ajuda, entre em contato conosco. :)');
	bot.send(msg);
	bot.beginDialog(user.address, '*:/confirmTimer', { userDialog: user.session.dialogName });
}

bot.dialog('/confirmTimer', [
	(session, args) => {
		[userDialog] = [args.userDialog];
		builder.Prompts.choice(
			session, 'Você pode desativar mensagens automáticas como a de cima no menu de Informações.', 'Ok',
			{
				listStyle: builder.ListStyle.button,
			} // eslint-disable-line comma-dangle
		);
	},
	(session) => {
		session.send('Voltando pro fluxo normal...');
		session.replaceDialog(userDialog);
	},
]);

const timer = () => {
	const d = new Date(Date.now());
	const limit = new Date(d.setHours(d.getHours() - 5));

	UserMission.findAll({
		attributes: ['createdAt', 'completed', 'user_id'],
		where: {
			completed: false,
			createdAt: { $lte: limit },
		},
	}).then((missions) => {
		missions.forEach((element) => {
			console.log(`mandando para: ${element.user_id}`);
			User.findOne({
				attributes: ['address', 'session'],
				where: {
					id: element.user_id,
					address: { // search for people that accepted receiving messages(address = not null)
						$ne: null,
					},
				},
			}).then((userData) => {
				sendWarning(userData);
			}).catch(() => {
				console.log('Coundn\'t find User');
			});
		});
	}).catch(() => {
		console.log('Coundn\'t find UserMission');
	});
};

module.exports.timer = timer;
