require('./db/connection')
var restify = require('restify');
var builder = require('botbuilder');

// Configurando servidor Restify
var server = restify.createServer();
server.listen(process.env.port || 3978, function () {
    console.log('%s listening to %s', server.name, server.url); 
});

// Create bot and add dialogs

var connector = new builder.ChatConnector({
    appID: "",
    appPassword: "",
});

server.post('/api/messages', connector.listen());

var bot = new builder.UniversalBot(connector);
bot.dialog('/', function (session) {

    var msg = new builder.Message(session)
    .text("Olá! Aqui é o Guaxi, o chatbot do Gastos Abertos! Escolha uma opção abaixo:")
    .suggestedActions(
        builder.SuggestedActions.create(
                session, [
                    builder.CardAction.imBack(session, "productId=1&color=green", "Quero me inscrever no processo de missões."),
                ]
            ));
    session.send(msg);

});

