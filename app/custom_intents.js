// A class for attaching custom intents to dialogs

module.exports.allIntents = function allIntents(message, intents) {
	console.log(`Você digitou: ${message}`);

	intents.recognize(message, (iDontGetIt, request) => {
		console.log(`oq eu saiu: ${Object.entries(request)}`);
		// to be made after lunch
	});
};
