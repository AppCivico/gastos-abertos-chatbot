var builder = require('botbuilder');
var dateFns = require('date-fns');

var retryPrompts = require('../misc/speeches_utils/retry-prompts');

User        = require('../server/schema/models').user;
UserMission = require('../server/schema/models').user_mission;

const library = new builder.Library('game');
const Yes     = "Sim";
const No      = "Não";

let email = "";
let user;
let user_mission;

var firstMissionCompleteMinDate = dateFns.format(new Date(2017, 08, 19), 'MM/DD/YYYY');
var today                       = dateFns.format(new Date(), 'MM/DD/YYYY');

library.dialog('/', [
    (session) => {
        session.sendTyping();
        session.beginDialog('validators:email', {
            prompt: "Qual é o e-mail que você utilizou para se cadastrar como líder?",
            retryPrompt: retryPrompts.email,
            maxRetries: 10
        });
    },
    (session, args) => {
        if (args.resumed) {
            session.sendTyping();
            session.send('Você tentou inserir um e-mail inválido muitas vezes. Tente novamente mais tarde.');
            session.endDialogWithResult({ resumed: builder.ResumeReason.notCompleted });
            return;
        }

        email = args.response;
        session.sendTyping();

        User.count({
            where: {
                email: email
            }
        })
        .then(count => {
            if (count != 0) {
                session.sendTyping();
                session.replaceDialog('/missionStatus');
                return email;
            } else {
                session.sendTyping();
                session.send("Hmmm...Não consegui encontrar seu cadastro. Tente novamente.");
                session.endDialog();
                return;
            }
        });
    },
]).cancelAction('cancelar', null, { matches: /^cancelar/i });

library.dialog('/missionStatus', [
    (session) => {
        /*
            Verifica se o usuário está ativo, aprovado e se possui alguma entrada na
            tabela 'user_mission'. Caso ele não tenha nenhuma entrada, está aprovado mas está
            inativo. Devo então iniciar o processo da primeira missão
        */
        User.findOne({
            where: {
                email: email
            }
        }).then(User => {
            user = User.dataValues;

            UserMission.count({
                where: {
                    user_id: user.id
                }
            })
            .then(count => {
                if (count === 0 && !user.active && user.approved) {
                    session.replaceDialog('/firstMissionAssign');
                    return user;
                } else {
                    session.replaceDialog('/currentMission');
                }
            });
        });
    }
]).cancelAction('cancelar', null, { matches: /^cancelar/i });

library.dialog('/currentMission', [
    (session) => {
        UserMission.findAll({
            where: {
                user_id: user.id,
            }
        })
        .then(UserMission => {
            user_mission = UserMission[UserMission.length-1].dataValues;
            console.log(user_mission);

            switch(user_mission.mission_id) {
                case 1:

                    if (today < firstMissionCompleteMinDate) {
                        session.send("Vi aqui que você está na primeira missão.\n\nVocê poderá conclui-la a partir do dia 19/09/2017");
                        session.endDialog();
                    } else {
                        session.replaceDialog('/firstMissionCompletePrompt');
                    }
                    break;
            }
        });
    }
]).cancelAction('cancelar', null, { matches: /^cancelar/i });

library.dialog('/firstMissionAssign', [
    (session) => {
        UserMission.create({
            user_id: user.id,
            mission_id: 1,
        })
        .then(UserMission => {
            session.send("Vamos lá! Que comece o processo de missões!");
            session.send("Nessa missão, a sua tarefa será realizar um mapeamento da existência e qualidade do portal de transparência do seu município. \nVocê poderá utilizar esse dois portais de transparência como referência no Brasil:");
            session.send("Curitiba - http://www.transparencia.curitiba.pr.gov.br/ .\n Recife - http://transparencia.recife.pe.gov.br/codigos/web/geral/home.php\nEles não são perfeitos, mas servem como referência para o trabalho de outros municípios.");
            session.send("Para concluir a primeira missão, você deverá me chamar e selecionar a opção “Processo de missões” novamente e eu irei te fazer algumas perguntas sobre a missão.\n\nIMPORTANTE: a conclusão da primeira missão será liberada apenas no dia 19/09/2017 e apenas após você responder as perguntas sua conclusão será confirmada.");
            session.endDialog();
        });
    }
]).cancelAction('cancelar', null, { matches: /^cancelar/i });

library.dialog('/firstMissionCompletePrompt', [
    (session) => {
        session.sendTyping();
        builder.Prompts.choice(session,
            "Pelo o que vi aqui você está na primeira missão, vamos conclui-la?",
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
                    session.replaceDialog('/firstMissionComplete');
                    break;
                case No:
                    break;
            }
        }
    }
]).cancelAction('cancelar', null, { matches: /^cancelar/i });

library.dialog('/firstMissionComplete', [
    (session) => {
        builder.Prompts.choice(session,
            'Há um portal para transparência orçamentária na cidade, mantido oficialmente pela prefeitura? (Responda com Sim ou Não)',
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
                    session.dialogData.transparencyPortalExists = 1;
                    builder.Prompts.text(session, "Qual é a URL(link) do portal?");
                    break;
                case No:
                    session.dialogData.transparencyPortalExists = 0;
                    break;
            }
        }
    },

    (session, result) => {
        session.dialogData.transparencyPortalURL = result.response;

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

    (session, result) => {
        session.sendTyping();
        if (result.response) {
            switch (result.response.entity) {
                case Yes:
                    session.dialogData.transparencyPortalHasFinancialData = 1;
                    break;
                case No:
                    session.dialogData.transparencyPortalHasFinancialData = 0;
                    break;
            }
        }
    },
    (session, result) => {
        console.log(session.dialogData.transparencyPortalURL);
        // builder.Prompts.choice(session,
        //                 'É possível realizar download dos dados orçamentários? (Responda com Sim ou Não)',
        //                 [Yes, No],
        //                 {
        //                     listStyle: builder.ListStyle.button,
        //                     retryPrompt: retryPrompts.choice
        //                 }
        //             );
    }
]).cancelAction('cancelar', null, { matches: /^cancelar/i });

module.exports = library;