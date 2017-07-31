require('./db/connection');
require('./connectorSetup.js')();
bot.library(require('./dialogs/game-sign-up'));

const GameSignUpOption = "Inscreva-me no processo de missões";

bot.dialog('/', [
    function (session) {
        session.replaceDialog('/promptButtons');
    }
]);

bot.dialog('/promptButtons', [
    (session) => {
        builder.Prompts.choice(session,
            "Olá! Aqui é o Guaxi, o chatbot do Gastos Abertos! Escolha uma opção abaixo:",
            [GameSignUpOption],
            { listStyle: builder.ListStyle.button });
    },
    (session, result) => {
        if (result.response) {
            switch (result.response.entity) {
                case GameSignUpOption:
                    session.beginDialog('gameSignUp:/');
                    break;
            }
        } else {
            session.send(`I am sorry but I didn't understand that. I need you to select one of the options below`);
        }
    }
]);
