bot.library(require('./game-sign-up'));
bot.library(require('./other-options'));

var builder = require('botbuilder');

const library = new builder.Library('gastosAbertosInformation');

const secondGastosAbertosCicle       = "O 2º ciclo do Gastos Abertos";
const gameSignUp                     = "Fazer sua inscrição para o 2º Ciclo";
const firstGastosAbertosCicleResults = "Os resultados de nosso 1º Ciclo";
const otherInformations              = "Outras informações";
const yes                            = "Sim, vamos lá!";
const no                             = "Não";

library.dialog('/', [
    (session) => {
        builder.Prompts.choice(session,
            "Que bom, a equipe do Gastos Abertos tem o objetivo de conectar cidadãos com o orçamento público.\
            Acreditamos na mobilização e na educação cidadã sobre transparência nos municípios brasileiros.\
            Quer conhecer mais sobre:",
            [ secondGastosAbertosCicle, gameSignUp, firstGastosAbertosCicleResults ],
            { listStyle: builder.ListStyle.button }
        );
    },
    (session, result) => {
        if (result.response) {
            switch (result.response.entity) {
                case secondGastosAbertosCicle:
                    session.replaceDialog('/secondGastosAbertosCicle');
                    break;
                case gameSignUp:
                    session.replaceDialog('/gameSignUpConfirmation');
                    break;
                case firstGastosAbertosCicleResults:
                    session.replaceDialog('/firstGastosAbertosCicleResults');
                    break;
                default :
                    session.send('Desculpa, não entendi a opção que você selecionou.');
                    break;
            }
        }
    }
]);

library.dialog('/secondGastosAbertosCicle', [
    (session) => {
        builder.Prompts.choice(session,
            "Neste 2º ciclo, queremos replicar a execução do Gastos Abertos em diferentes municípios, aprimorar a metodologia,\
            ampliar o número de lideranças formadas e portais de transparência avaliados. \
            Espero por você em nessa nova jornada",
            [ gameSignUp, firstGastosAbertosCicleResults, otherInformations ],
            { listStyle: builder.ListStyle.button }
        );
    },
    (session, result) => {
        if (result.response) {
            switch (result.response.entity) {
                case firstGastosAbertosCicleResults:
                    session.replaceDialog('/firstGastosAbertosCicleResults');
                    break;
                case gameSignUp:
                    session.replaceDialog('/gameSignUpConfirmation');
                    break;
                case otherInformations:
                    break;
                default :
                    session.send('Desculpa, não entendi a opção que você selecionou.');
                    break;
            }
        }
    }
]);

library.dialog('/firstGastosAbertosCicleResults', [
    (session) => {
        builder.Prompts.choice(session,
            "No primeiro ciclo do gastos Abertos (2016-2017), tivemos 181 lideranças inscritas, 150 municípios atendidos, \
            75 portais de transparência avaliados, 25 pedidos realizados, 3 dados públicos de orçamento abertos e \
            1 carta compromisso assinada. Para o segundo ciclo, queremos atender mais municípios e formar novas lideranças.",
            [ gameSignUp, otherInformations ],
            { listStyle: builder.ListStyle.button }
        );
    },
    (session, result) => {
        if (result.response) {
            switch (result.response.entity) {
                case gameSignUp:
                    session.replaceDialog('/gameSignUpConfirmation');
                    break;
                case otherInformations:
                    session.beginDialog('otherOptions:/');
                    break;
                default :
                    session.send('Desculpa, não entendi a opção que você selecionou.');
                    break;
            }
        }
    }
]);

library.dialog('/gameSignUpConfirmation', [
    (session) => {
        builder.Prompts.choice(session,
            "Uhu! Seja bem vindo ao time. \
            Serei seu agente virtual em todas as missões. \
            Com Guaxi, missão dada é missão cumprida. \
            \n\nVamos começar?",
            [ yes, no ],
            { listStyle: builder.ListStyle.button }
        );
    },
    (session, result) => {
        if (result.response) {
            switch (result.response.entity) {
                case yes:
                    session.beginDialog('gameSignUp:/');
                    break;
                case no:
                    session.replaceDialog('/gameSignUpDeclined');
                    break;
                default :
                    session.send('Desculpa, não entendi a opção que você selecionou.');
                    break;
            }
        }
    }
]);

library.dialog('/gameSignUpDeclined', [
    (session) => {
        builder.Prompts.choice(session,
            "Ok! Posso te ajudar com alguma informação sobre",
            [secondGastosAbertosCicle, firstGastosAbertosCicleResults, otherInformations ],
            { listStyle: builder.ListStyle.button }
        );
    },
    (session, result) => {
        if (result.response) {
            switch (result.response.entity) {
                case secondGastosAbertosCicle:
                    session.replaceDialog('/secondGastosAbertosCicle');
                    break;
                case firstGastosAbertosCicleResults:
                    session.replaceDialog('/firstGastosAbertosCicleResults');
                    break;
                case otherInformations:
                    session.beginDialog('otherOptions:/');
                    break;
                default :
                    session.send('Desculpa, não entendi a opção que você selecionou.');
                    break;
            }
        }
    }
]);

module.exports = library;