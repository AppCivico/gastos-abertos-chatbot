// A class for attaching custom intents to dialogs

const allIntents = (message, intents, callback) => {
	intents.recognize(message, (iDontGetIt, request) => {
		console.log(`Intent: ${Object.entries(request)}`);
		let dialog;
		switch (request.intent) {
		case 'ajuda':
			dialog = 'gastosAbertosInformation:/';
			break;
		case 'missoes':
			dialog = 'game:/';
			break;
		case 'pedido':
			dialog = 'informationAccessRequest:/';
			break;
		default: // Default Fallback Intent
			dialog = 'error';
			break;
		}
		callback(dialog);
	});
};

module.exports.allIntents = allIntents;
