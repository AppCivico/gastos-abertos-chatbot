// Collection of functions for saving users sessions and getting usernames from facebook

const request = require('request');

const errorLog = require('../misc/send_log');

const User = require('../server/schema/models').user;

// gets usernames from facebook
const userFacebook = (userID, pageToken, callback) => {
	request(`https://graph.facebook.com/v2.12/${userID}?fields=first_name,last_name,email,birthday&access_token=${pageToken}`, (error, response, body) => {
		console.log('error:', error);
		console.log('statusCode:', response && response.statusCode);
		console.log('body:', body, '\n');
		callback(JSON.parse(body), error);
	});
};

module.exports.userFacebook = userFacebook;

// update user session
const updateSession = (fbId, session, usefulData = '') => {
	User.update({
		session: {
			dialogName: session.dialogStack()[session.dialogStack().length - 1].id,
			usefulData,
		//	waterfallStep: Object.values(session.dialogStack()[session.dialogStack().length - 1].state),
		},
	}, {
		where: {
			fb_id: fbId,
		},
		returning: true,
	}).then(() => {
		console.log('User session updated sucessfuly');
	}).catch((err) => {
		errorLog.storeErrorLog(session, `Error updating user session [UpdateSession] => ${err}`);
		session.replaceDialog('*:/getStarted');
	});
};

module.exports.updateSession = updateSession;
