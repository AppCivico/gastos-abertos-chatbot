const DialogFlow = require('apiai');

const app = DialogFlow(process.env.DIALOGFLOW_TOKEN);

module.exports = {
	recognize: (context, callback) => {
		const request = app.textRequest(context.message.text, {
			sessionId: Math.random(),
			language: 'pt-BR',
		});

		request.on('response', (response) => {
			const { result } = response;

			console.log(`Result => ${Object.entries(result)}`);

			callback(null, {
				intent: result.metadata.intentName,
				score: result.score,
			});
		});

		request.on('error', (error) => {
			console.log(`Erro => ${error}`);
			callback(error);
		});

		request.end();
	} // eslint-disable-line comma-dangle
};
