// A class for attaching custom intents to dialogs

const allIntents = (message, intents, callback) => {
	intents.recognize(message, (iDontGetIt, request2) => {
		console.log(`Intent: ${Object.entries(request2)}`);
		let dialog;
		switch (request2.intent) {
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
