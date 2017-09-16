const library = new builder.Library('firstMissionConclusion');

bot.library(require('../second_mission/assign'));

let answers = {};
answers[
    'transparencyPortalExists',
    'transparencyPortalURL',
    'transparencyPortalHasFinancialData',
    'transparencyPortalAllowsFinancialDataDownload',
    'transparencyPortalFinancialDataFormats',
    'transparencyPortalHasContractsData',
    'transparencyPortalHasBiddingsData',
    'transparencyPortalHasBiddingProcessData'
];

var retryPrompts = require('../../misc/speeches_utils/retry-prompts');
var texts        = require("../../misc/speeches_utils/big-texts");
var emoji        = require("../../misc/speeches_utils/emojis");

User        = require('../../server/schema/models').user;
UserMission = require('../../server/schema/models').user_mission;

const Yes              = "Sim";
const No               = "Não";
const MoreInformations = "Detalhes da missão";

let user;
let user_mission;

library.dialog('/', [
    (session, args) => {
        user         = args.user;
        user_mission = args.user_mission;

        session.sendTyping();
        builder.Prompts.choice(session,
            "Pelo o que vi aqui você está na primeira missão, vamos conclui-la?",
            [Yes, No, MoreInformations],
            {
                listStyle: builder.ListStyle.button,
                retryPrompt: retryPrompts.choice
            }
        );
    },
    (session, result) => {
        session.sendTyping();
        if (result.response) {
            switch (result.response.entity) {
                case Yes:
                    session.replaceDialog('/transparencyPortalExists');
                    break;
                case No:
                    session.send('Okay! Estarei te esperando para mandarmos ver nessa tarefa!' + emoji.sunglass);
                    session.endDialog();
                    session.beginDialog('/');
                    break;
                case MoreInformations:
                    session.send(texts.first_mission.details);
                    session.replaceDialog('/conclusionPromptAfterMoreDetails');
                    break;
            }
        }
    }
]).cancelAction('cancelar', null, { matches: /^cancelar/i });

library.dialog('/conclusionPromptAfterMoreDetails', [
    (session) => {
        session.sendTyping();
        builder.Prompts.choice(session,
            "Vamos concluir nossa primeira missão juntos?" + emoji.smile,
            [Yes, No],
            {
                listStyle: builder.ListStyle.button,
                retryPrompt: retryPrompts.choice
            }
        );
    },

    (session, result) => {
        session.sendTyping();
        if (result.response) {
            switch (result.response.entity) {
                case Yes:
                    session.replaceDialog('/transparencyPortalExists');
                    break;
                case No:
                    session.send('Okay! Estarei te esperando para mandarmos ver nessa tarefa!'  + emoji.sunglass);
                    session.endDialog();
                    break;
            }
        }
    }
]).cancelAction('cancelar', null, { matches: /^cancelar/i });

library.dialog('/transparencyPortalExists', [
    (session) => {
        session.sendTyping();
        builder.Prompts.choice(session,
            'Há um portal para transparência orçamentária na cidade, mantido oficialmente pela prefeitura? (Responda com Sim ou Não)',
            [Yes, No],
            {
                listStyle: builder.ListStyle.button,
                retryPrompt: retryPrompts.choice
            }
        );
    },

    (session, args) => {
        session.sendTyping();
        if (args.response) {
            switch (args.response.entity) {
                case Yes:
                    answers.transparencyPortalExists = 1;
                    session.replaceDialog('/transparencyPortalURL');
                    break;
                case No:
                    answers.transparencyPortalExists = 0;

                    //Neste caso o fluxo de conclusão se finaliza pois as próximas perguntas não farão sentido
                    session.replaceDialog('/userUpdate');
                    break;
            }
        }
    },

    (session, args) => {
        session.dialogData.transparencyPortalURL = args.response;

        session.sendTyping();
        builder.Prompts.choice(session,
            'Há dados sobre a execução orçamentária disponível no portal de transparência? (Responda com Sim ou Não)',
            [Yes, No],
            {
                listStyle: builder.ListStyle.button,
                retryPrompt: retryPrompts.choice
            }
        );
    },

    (session, args) => {
        session.sendTyping();
        if (args.response) {
            switch (args.response.entity) {
                case Yes:
                    session.dialogData.transparencyPortalHasFinancialData = 1;
                    builder.Prompts.choice(session,
                        'É possível realizar download dos dados orçamentários? (Responda com Sim ou Não)',
                        [Yes, No],
                        {
                            listStyle: builder.ListStyle.button,
                            retryPrompt: retryPrompts.choice
                        }
                    );
                    switch (args.response.entity) {
                        case Yes:
                            session.send("yea");
                            break;
                        case No:
                            session.send("nope");
                            break;
                    }
                    break;
                case No:
                    session.dialogData.transparencyPortalHasFinancialData = 0;
                    builder.Prompts.choice(session,
                        'Os contratos assinados com a prefeitura estão disponíveis no portal de transparência? (Responda com Sim ou Não)',
                        [Yes, No],
                        {
                            listStyle: builder.ListStyle.button,
                            retryPrompt: retryPrompts.choice
                        }
                    );
                    break;
            }
        }
    },
]).cancelAction('cancelar', null, { matches: /^cancelar/i });

library.dialog('/transparencyPortalURL', [
    (session) => {
        session.sendTyping();
        builder.Prompts.text(session, "Qual é a URL(link) do portal?\n\nExemplo de uma URL: https://gastosabertos.org/");
    },

    (session, args) => {
        answers.transparencyPortalURL = args.response;
        session.replaceDialog('/transparencyPortalHasFinancialData');
    }
]).cancelAction('cancelar', null, { matches: /^cancelar/i });

library.dialog('/transparencyPortalHasFinancialData', [
    (session) => {
        session.sendTyping();
        builder.Prompts.choice(session,
            'Há dados sobre a execução orçamentária disponível no portal de transparência? (Responda com Sim ou Não)',
            [Yes, No],
            {
                listStyle: builder.ListStyle.button,
                retryPrompt: retryPrompts.choice
            }
        );
    },

    (session, args) => {
        switch (args.response.entity) {
            case Yes:
                answers.transparencyPortalHasFinancialData = 1;
                session.replaceDialog('/transparencyPortalAllowsFinancialDataDownload');
                break;
            case No:
                answers.transparencyPortalHasFinancialData = 0;
                session.replaceDialog('/transparencyPortalHasContractsData');
                break;
        }
    }
]).cancelAction('cancelar', null, { matches: /^cancelar/i });

library.dialog('/transparencyPortalAllowsFinancialDataDownload', [
    (session) => {
        session.sendTyping();
        builder.Prompts.choice(session,
            'É possível realizar download dos dados orçamentários? (Responda com Sim ou Não)',
            [Yes, No],
            {
                listStyle: builder.ListStyle.button,
                retryPrompt: retryPrompts.choice
            }
        );
    },

    (session, args) => {
        switch (args.response.entity) {
            case Yes:
                answers.transparencyPortalAllowsFinancialDataDownload = 1;
                session.replaceDialog('/transparencyPortalFinancialDataFormats');
                break;
            case No:
                answers.transparencyPortalAllowsFinancialDataDownload = 0;
                session.replaceDialog('/transparencyPortalHasContractsData');
                break;
        }
    }
]).cancelAction('cancelar', null, { matches: /^cancelar/i });

library.dialog('/transparencyPortalFinancialDataFormats', [
    (session) => {
        session.sendTyping();
        builder.Prompts.text(session, "Você saberia dizer, qual o formato que estes arquivos estão ? Ex.: CSV, XLS, XML.");
    },

    (session, args) => {
        answers.transparencyPortalFinancialDataFormats = args.response;
        session.replaceDialog('/transparencyPortalHasContractsData');
    }
]).cancelAction('cancelar', null, { matches: /^cancelar/i });

library.dialog('/transparencyPortalHasContractsData', [
    (session) => {
        session.sendTyping();
        builder.Prompts.choice(session,
            'Os contratos assinados com a prefeitura estão disponíveis no portal de transparência? (Responda com Sim ou Não)',
            [Yes, No],
            {
                listStyle: builder.ListStyle.button,
                retryPrompt: retryPrompts.choice
            }
        );
    },

    (session, args) => {
        switch (args.response.entity) {
            case Yes:
                answers.transparencyPortalHasContractsData = 1;
                break;
            case No:
                answers.transparencyPortalHasContractsData = 0;
                break;
        }
        session.replaceDialog('/transparencyPortalHasBiddingsData');
    }
]).cancelAction('cancelar', null, { matches: /^cancelar/i });

library.dialog('/transparencyPortalHasBiddingsData', [
    (session) => {
        session.sendTyping();
        builder.Prompts.choice(session,
            'As licitações são divulgadas no portal de transparência da cidade? (Responda com Sim ou Não)',
            [Yes, No],
            {
                listStyle: builder.ListStyle.button,
                retryPrompt: retryPrompts.choice
            }
        );
    },

    (session, args) => {
        switch (args.response.entity) {
            case Yes:
                answers.transparencyPortalHasBiddingsData = 1;
                break;
            case No:
                answers.transparencyPortalHasBiddingsData = 0;
                break;
        }
        session.replaceDialog('/transparencyPortalHasBiddingProcessData');
    }
]).cancelAction('cancelar', null, { matches: /^cancelar/i });

library.dialog('/transparencyPortalHasBiddingProcessData', [
    (session) => {
        session.sendTyping();
        builder.Prompts.choice(session,
            'É possível acompanhar o status do processo licitatório pelo portal de transparência? (Responda com Sim ou Não)',
            [Yes, No],
            {
                listStyle: builder.ListStyle.button,
                retryPrompt: retryPrompts.choice
            }
        );
    },

    (session, args) => {
        switch (args.response.entity) {
            case Yes:
                answers.transparencyPortalHasBiddingProcessData = 1;
                break;
            case No:
                answers.transparencyPortalHasBiddingProcessData = 0;
                break;
        }
        session.replaceDialog('/userUpdate');
    }
]).cancelAction('cancelar', null, { matches: /^cancelar/i });

library.dialog('/userUpdate', [
    (session) => {
        UserMission.update({
            completed: true,
            metadata: answers
        }, {
            where: {
                user_id: user.id,
                mission_id: 1,
                completed: false
            },
            returning: true,
        })
        .then(result => {
            console.log(result + "Mission updated sucessfuly");
            session.send("Uhuuu! Concluímos nossa primeira missão!\n\nEu disse que formariamos uma boa equipe!" + emoji.sunglass + emoji.clap);

            session.beginDialog(
                'secondMissionAssign:/',
                {
                    user:         user,
                    user_mission: user_mission
                }
            );
        })
        .catch(e => {
            console.log("Error updating mission" + e);
            session.send('Oooops...Tive um problema ao criar seu cadastro. Tente novamente mais tarde.');
            session.endDialogWithResult({ resumed: builder.ResumeReason.notCompleted });
            throw e;
        });
    },
]).cancelAction('cancelar', null, { matches: /^cancelar/i });

module.exports = library;