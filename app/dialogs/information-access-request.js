bot.library(require('./contact'));

PDFDocument = require('pdfkit');

var builder           = require('botbuilder');
var GoogleSpreadsheet = require('google-spreadsheet');

var emoji        = require('../misc/speeches_utils/emojis');
var retryPrompts = require('../misc/speeches_utils/retry-prompts');

User = require('../server/schema/models').user;

const library = new builder.Library('informationAccessRequest');

const Yes = "Sim";
const No  = "Não";

let user, user_mission;

let itens = [];

library.dialog('/', [
    (session, args) => {
        if (args.user && args.user_mission) {
            user         = args.user;
            user_mission = args.user_mission;

            session.replaceDialog('/userPartOfTheGame');
        }
    }
]).cancelAction('cancelar', null, { matches: /^cancelar/i });

library.dialog('/userPartOfTheGame', [
    (session) => {
        var firstMissionAnswers = user_mission.metadata;

        console.log(firstMissionAnswers);

        if (!firstMissionAnswers.transparencyPortalExists) {
        }

        session.sendTyping();
        builder.Prompts.choice(session,
            "A respeito dos gastos, o site permite que você identifique todos os seguintes itens?" +
            "\n\n\n - Qual o número do processo que deu origem aquele gasto;" +
            "\n\n\n - O bem fornecido ou o serviço prestado ao seu município;" +
            "\n\n\n - Pessoa física ou jurídica beneficiária do pagamento;" +
            "\n\n\n - E, quando for o caso, o procedimento licitatório realizado.",
            [Yes, No],
            {
                listStyle: builder.ListStyle.button,
                retryPrompt: retryPrompts.choice
            }
        );
    },

    (session, args) => {
        console.log(args.response);
        switch(args.response.entity) {
            case Yes:
                break;
            case No:
                builder.Prompts.choice(session,
                    "Seu município identifica de onde vêm os recursos que ele recebe? \n- ele tem que identificar, pelo menos, se os recursos vêm da União, do estado, da cobrança de impostos ou de empréstimos.",
                    [Yes, No],
                    {
                        listStyle: builder.ListStyle.button,
                        retryPrompt: retryPrompts.choice
                    }
                );
                break;
        }

    },

    (session, args) => {
        switch(args.response.entity) {
            case Yes:
                break;
            case No:
                itens.push(" - Disponibilização sobre receitas, despesas e endividamento público, nos termos da Lei Complementar 131, de 27 de maio de 2009, e demais regras aplicáveis;");
                break;
        }

        builder.Prompts.choice(session,
            "O portal de transparência disponibiliza dados referentes a remuneração de cada um dos agentes públicos, individualizada?",
            [Yes, No],
            {
                listStyle: builder.ListStyle.button,
                retryPrompt: retryPrompts.choice
            }
        );
    },

    (session, args) => {
        switch(args.response.entity) {
            case Yes:
                break;
            case No:
                itens.push(" - Disponibilização sobre remuneração de cada um dos agentes públicos, individualizada – o modelo do Portal da Transparência do Governo Federal é um exemplo;");
                break;
        }
    }
]).cancelAction('cancelar', null, { matches: /^cancelar/i });

module.exports = library;