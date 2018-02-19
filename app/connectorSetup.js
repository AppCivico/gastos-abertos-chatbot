/* global  bot:true builder:true */
const restify = require('restify');
global.builder = require('botbuilder');

module.exports = () => {
	// If testing via the emulator, no need for appId and appPassword.
	// If publishing, enter appId and appPassword here
	const connector = new builder.ChatConnector({
		appId: process.env.MICROSOFT_APP_ID ? process.env.MICROSOFT_APP_ID : '',
		appPassword: process.env.MICROSOFT_APP_PASSWORD ? process.env.MICROSOFT_APP_PASSWORD : '',
		// appId: '', // process.env.MICROSOFT_APP_ID ? process.env.MICROSOFT_APP_ID : '',
		// appPassword: '', // process.env.MICROSOFT_APP_PASSWORD ? process.env.MICROSOFT_APP_PASSWORD : '',
		gzipData: true,
	});

	global.bot = new builder.UniversalBot(connector);

	// Setup Restify Server
	const server = restify.createServer();
	server.listen(process.env.port || 1998, () => {
		console.log('%s listening to %s', server.name, server.url);
	});
	server.post('/api/messages', connector.listen());
	bot.use(builder.Middleware.dialogVersion({ version: 0.3, resetCommand: /^reset/i }));
	bot.set('persistConversationData', false);
};
