// /* global bot:true builder:true */

// A class for chatbase integration

require('dotenv').config();

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

function MessageHandled(userId, interation, message) {
	chatbase.newMessage()
		.setIntent(interation) // the intent of the user message
		.setMessage(message) // the message itself
		.setTimestamp(Date.now().toString())
		.send()
		.then(() => console.log('Sucess!'))
		.catch(e => console.error(e));
}

module.exports.MessageHandled = MessageHandled;

function msgUnhandled(userId, interation, message) {
	chatbase.newMessage()
		.setIntent(interation)
		.setMessage(message)
		.setTimestamp(Date.now().toString())
		.setAsNotHandled()
		.send()
		.then(() => console.log('Sucess!'))
		.catch(e => console.error(e));
}

module.exports.msgUnhandled = msgUnhandled;

// function trackLink(url, platform) {
// 	// usage: session.send(chatBase.trackLink('http://www.google.com', session.message.address.channelId));
// 	// For now, the chatbase library doesn't suport link tapping. So, we need the link.
// 	// DONT use this without passing it through something like TinyUrl(security reasons)
// 	return `https://chatbase.com/r?api_key=${ChatbaseApiKey}&url=${url}&platform=${platform}`;
// }
//
// module.exports.trackLink = trackLink;
