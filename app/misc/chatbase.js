// /* global bot:true builder:true */

// A class for chatbase integration

require('dotenv').config();

const { ChatbaseApiKey } = process.env;

const chatbase = require('@google/chatbase')
	.setApiKey(ChatbaseApiKey) // Your api key
	.setPlatform('Messenger')// The platform the bot is interacting on/over
	.setVersion('1.0'); // The version of the bot deployed

function MessageHandled(userId, interation, message) {
	chatbase.newMessage()
		.setUserId(userId ? userId.toString() : '000') // The id of the user you are interacting with
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
		.setUserId(userId ? userId.toString() : '000')
		.setIntent(interation)
		.setMessage(message)
		.setTimestamp(Date.now().toString())
		.setAsNotHandled()
		.send()
		.then(() => console.log('Sucess!'))
		.catch(e => console.error(e));
}

module.exports.msgUnhandled = msgUnhandled;
