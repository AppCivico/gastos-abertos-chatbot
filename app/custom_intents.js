// A class for attaching custom intents to dialogs
const request = require('request');

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

// request
const userFacebook = (userID, pageToken, callback) => {
	request(`https://graph.facebook.com/v2.12/${userID}?fields=first_name,last_name,email,birthday&access_token=${pageToken}`, (error, response, body) => {
		console.log('error:', error); // Print the error if one occurred
		console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
		console.log('body:', body); // Print the HTML for the Google homepage.
		callback(JSON.parse(body));
	});
};

module.exports.userFacebook = userFacebook;
