const Request = require('request');

// the requests that actually send the messages to the users
// using fb_id to send messages allows us to send messages to everyone

const sendImageByFbId = (userData, textMsg, UrlImage, pageToken, groupText) => {
	Request.post({
		uri: `https://graph.facebook.com/v2.6/me/messages?access_token=${pageToken}`,
		'content-type': 'application/json',
		form: {
			messaging_type: 'UPDATE',
			recipient: {
				id: userData.fb_id,
			},
			message: {
				text: groupText,
			},
		},
	}, (error, response, body) => {
		console.log('error:', error);
		console.log('statusCode:', response && response.statusCode);
		console.log('body:', body);
		Request.post({
			uri: `https://graph.facebook.com/v2.6/me/messages?access_token=${pageToken}`,
			'content-type': 'application/json',
			form: {
				messaging_type: 'UPDATE',
				recipient: {
					id: userData.fb_id,
				},
				message: {
					attachment: {
						type: 'image',
						payload: {
							url: UrlImage,
							is_reusable: true,
						},
					},
				},
			},
		}, (error2, response2, body2) => {
			console.log('error:', error2);
			console.log('statusCode:', response2 && response2.statusCode);
			console.log('body:', body2);

			Request.post({
				uri: `https://graph.facebook.com/v2.6/me/messages?access_token=${pageToken}`,
				'content-type': 'application/json',
				form: {
					messaging_type: 'UPDATE',
					recipient: {
						id: userData.fb_id,
					},
					message: {
						text: textMsg,
						quick_replies: [
							{
								content_type: 'text',
								title: 'Voltar para o início',
								payload: 'reset',
							},
						],
					},
				},
			}, (error3, response3, body3) => {
				console.log('error:', error3);
				console.log('statusCode:', response3 && response3.statusCode);
				console.log('body:', body3);
			});
		});
	});
};

module.exports.sendImageByFbId = sendImageByFbId;

const sendMessageByFbId = (userData, textMsg, pageToken, groupText) => {
	Request.post({
		uri: `https://graph.facebook.com/v2.6/me/messages?access_token=${pageToken}`,
		'content-type': 'application/json',
		form: {
			messaging_type: 'UPDATE',
			recipient: {
				id: userData.fb_id,
			},
			message: {
				text: groupText,
			},
		},
	}, (error, response, body) => {
		console.log('error:', error);
		console.log('statusCode:', response && response.statusCode);
		console.log('body:', body);
		Request.post({
			uri: `https://graph.facebook.com/v2.6/me/messages?access_token=${pageToken}`,
			'content-type': 'application/json',
			form: {
				messaging_type: 'UPDATE',
				recipient: {
					id: userData.fb_id,
				},
				message: {
					text: textMsg,
					quick_replies: [
						{
							content_type: 'text',
							title: 'Voltar para o início',
							payload: 'reset',
						},
					],
				},
			},
		}, (error2, response2, body2) => {
			console.log('error:', error2);
			console.log('statusCode:', response2 && response2.statusCode);
			console.log('body:', body2);
		});
	});
};

module.exports.sendMessageByFbId = sendMessageByFbId;
