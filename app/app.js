require('dotenv').config();
require('./connectorSetup.js')();

bot.library(require('./validators'));
bot.library(require('./dialogs/game-sign-up'));
bot.library(require('./dialogs/other-options'));

const GameSignUpOption = "Inscreva-me no processo de missões";
const Yes = "Sim";
const No  = "Não";

bot.dialog('/', [
    function (session) {
        session.replaceDialog('/promptButtons');
    }
]);

bot.dialog('/promptButtons', [
    (session) => {
        builder.Prompts.choice(session,
            "Olá, Eu sou o Guaxi. Serei seu assistente do Gastos Abertos. Vamos iniciar seu cadastro?",
            [Yes, No],
            { listStyle: builder.ListStyle.button });
    },
    (session, result) => {
        if (result.response) {
            switch (result.response.entity) {
                /*
                Estes fluxos iniciais serão substituidos por outras opções,
                por enquanto eles serão apenas "Sim" ou "Não" por tratar apenas
                da inscrição de líderes no processo de missões
                */
                case Yes:
                    session.beginDialog('gameSignUp:/');
                    break;
                case No:
                    session.beginDialog('otherOptions:/');
                    break;
            }
        } else {
            session.send('Desculpa, não entendi a opção que você selecionou.');
        }
    }
]);
