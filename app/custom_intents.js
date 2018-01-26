// A class for attaching custom intents to dialogs

module.exports.allIntents = (message, intents) => {
	console.log(`Digitado: ${message}`);

	return intents.recognize(message, (iDontGetIt, request) => {
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
			dialog = 'default';
			break;
		}
		console.log(`dialog: ${dialog}`);
		return dialog;
	});
};
