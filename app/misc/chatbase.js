// /* global bot:true builder:true */

// A class for chatbase integration

require('dotenv').config();

const request = require('request');

const tinyUrl = 'http://tinyurl.com/api-create.php?url=';

const { ChatbaseApiKey } = process.env;
const chatbase = require('@google/chatbase')
	.setApiKey(ChatbaseApiKey); // Your api key

function setPlatform(userId = '000', platform = 'no_platform', version = '1.0') {
	// setting platform dynamically
	chatbase // 000 acts as a default user value in case something goes wrong
		.setUserId(userId) // The id of the user you are interacting with
		.setPlatform(platform)// The platform the bot is interacting on/over
		.setVersion(version); // The version of the bot deployed
}

module.exports.setPlatform = setPlatform;

function MessageHandled(interation, message) {
	chatbase.newMessage()
		.setIntent(interation) // the intent of the user message
		.setMessage(message) // the message itself
		.setTimestamp(Date.now().toString())
		.send()
		.then(() => console.log('Success!'))
		.catch(e => console.error(e));
}

module.exports.MessageHandled = MessageHandled;

function msgUnhandled(interation, message) {
	chatbase.newMessage()
		.setIntent(interation)
		.setMessage(message)
		.setTimestamp(Date.now().toString())
		.setAsNotHandled()
		.send()
		.then(() => console.log('Success!'))
		.catch(e => console.error(e));
}

module.exports.msgUnhandled = msgUnhandled;

function getTinyUrl(url, callback) {
	// Usage: await chatBase.getTinyUrl(
	// chatBase.trackLink('www.google.com', session.message.address.channelId),
	// (response) => { session.send('Click our link:' + response); next(); });
	// obs: we're using trackLink to get the actual link we want to cover up(see below)
	// obs2: 'await' so dont forget the async!
	request(`${tinyUrl}${url}`, (error, response, body) => {
		console.log('error:', error);
		console.log('statusCode:', response && response.statusCode);
		console.log('body:', body, '\n');
		callback(body);
	});
}

module.exports.getTinyUrl = getTinyUrl;

function trackLink(url, platform) {
	// usage: session.send(chatBase.trackLink('http://www.google.com', session.message.address.channelId));
	// For now, the chatbase library doesn't suport link tapping. So, we need the link.
	// DONT use this without passing it through something like TinyUrl(security reasons)
	// Use it with getTinyUrl(above)
	return `https://chatbase.com/r?api_key=${ChatbaseApiKey}&url=${url}&platform=${platform}`;
}

module.exports.trackLink = trackLink;
