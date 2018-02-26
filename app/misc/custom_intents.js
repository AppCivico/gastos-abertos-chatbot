const User = require('../server/schema/models').user;
// A class for attaching custom intents to dialogs and other random functions
const request = require('request');

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

// update user session
const updateSession = (fbId, session) => {
	User.update({
		session: {
			dialogName: session.dialogStack()[session.dialogStack().length - 1].id,
		//	waterfallStep: Object.values(session.dialogStack()[session.dialogStack().length - 1].state),
		},
	}, {
		where: {
			fb_id: fbId,
		},
		returning: true,
	})
		.then(() => {
			console.log('User session updated sucessfuly');
		})
		.catch((err) => {
			console.log(`Couldn't update  session updated sucessfuly: ${err}`);
			throw err;
		});
};

module.exports.updateSession = updateSession;

// update user session saving useful flow data TODO
const updateSessionData = (fbId, session, usefulData) => {
	User.update({
		session: {
			dialogName: session.dialogStack()[session.dialogStack().length - 1].id,
			usefulData,
		},
	}, {
		where: {
			fb_id: fbId,
		},
		returning: true,
	})
		.then(() => {
			console.log('User session updated sucessfuly');
		})
		.catch((err) => {
			console.log(`Couldn't update  session updated sucessfuly: ${err}`);
			throw err;
		});
};

module.exports.updateSessionData = updateSessionData;
