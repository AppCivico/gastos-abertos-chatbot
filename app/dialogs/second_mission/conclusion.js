const library = new builder.Library('secondMissionConclusion');

let answers = {};
answers[
    'userProtocoledRequest',
    'govAnswered',
    'answerWasSatisfactory'
];

var retryPrompts = require('../../misc/speeches_utils/retry-prompts');
var texts        = require("../../misc/speeches_utils/big-texts");
var emoji        = require("../../misc/speeches_utils/emojis");

User        = require('../../server/schema/models').user;
UserMission = require('../../server/schema/models').user_mission;

const HappyYes = "Vamos lá!";
const Yes      = "Sim";
const No       = "No";

let user, user_mission;
library.dialog('/', [
    (session, args) => {

        if (!args.user && args.user_mission) {
            session.send("Ooops, houve algum problema, vamos voltar para o início.");
            session.endDialog();
            session.beginDialog('/welcomeBack');
        }

        user         = args.user;
        user_mission = args.user_mission;

        session.sendTyping();
        builder.Prompts.choice(session,
            "Pelo o que vi aqui você está na segunda missão, vamos conclui-la?",
            [HappyYes],
            {
                listStyle: builder.ListStyle.button,
                retryPrompt: retryPrompts.choice
            }
        );

    },

    (session, result) => {
        if (result.response) {
            switch (result.response.entity) {
                case HappyYes:
                    session.replaceDialog('/secondMissionQuestions');
                    break;
            }
        }
    }
]);

library.dialog('/secondMissionQuestions', [
    (session, args) => {
        session.sendTyping();
        builder.Prompts.choice(session,
            "Você protocolou o pedido de acesso à informação?",
            [Yes, No],
            {
                listStyle: builder.ListStyle.button,
                retryPrompt: retryPrompts.choice
            }
        );
    },

    (session, result) => {
        if (result.response) {
            switch (result.response.entity) {
                case Yes:
                    answers.userProtocoledRequest = 1;
                    builder.Prompts.choice(session,
                        "A prefeitura respondeu o seu pedido?",
                        [Yes, No],
                        {
                            listStyle: builder.ListStyle.button,
                            retryPrompt: retryPrompts.choice
                        }
                    );
                    break;
                case No:
                    session.send("Que pena! No entanto recomendamos que você o protocole mesmo assim. Pois é bem importante que a sociedade civil demande dados.");
                    session.send("Agora vou te levar para o início");
                    session.endDialog();
                    session.beginDialog('/welcomeBack');
                    break;
            }
        }
    },

    (session, result) => {
        if (result.response) {
            switch (result.response.entity) {
                case Yes:
                    answers.govAnswered = 1;
                    builder.Prompts.choice(session,
                        "A resposta da prefeitura foi satisfatória?",
                        [Yes, No],
                        {
                            listStyle: builder.ListStyle.button,
                            retryPrompt: retryPrompts.choice
                        }
                    );
                    break;
                case No:
                    answers.govAnswered = 0;
                    session.send("Que pena! No entanto não vamos desistir!");
                    session.replaceDialog('/conclusion');
                    break;
            }
        }
    },

    (session, result) => {
        if (result.response) {
            switch (result.response.entity) {
                case Yes:
                    answers.answerWasSatisfactory = 1;
                    break;
                case No:
                    answers.answerWasSatisfactory = 0;
                    break;
            }
        }

        session.replaceDialog('/conclusion');
    },
]);

library.dialog('/conclusion', [
    (session, args) => {
        UserMission.update({
            completed: true,
            metadata: answers
        }, {
            where: {
                user_id: user.id,
                mission_id: 2,
                completed: false
            },
            returning: true,
        })
        .then(result => {
            console.log(result + "Mission updated sucessfuly");
            session.replaceDialog('/congratulations');
        })
        .catch(e => {
            console.log("Error updating mission" + e);
            session.send('Oooops...Tive um problema ao criar seu cadastro. Tente novamente mais tarde.');
            session.endDialogWithResult({ resumed: builder.ResumeReason.notCompleted });
            throw e;
        });
    }
]);

library.dialog('/congratulations', [
    (session) => {
        session.send("Parabéns! Você concluiu o processo de missões do Gastos Abertos! Muito obrigado de participar comigo nessa!");
        session.send("Aposto que eu e você aprendemos muitas coisas novas nesse processo!");
        session.send("No entanto eu irei te dar uma tarefa extra, ela é difícil, mas toda a equipe do Gastos Abertos está com você nessa!");
        session.send("Essa tarefa extra será buscar a assinatura de seu prefeito(a) para a Carta Compromisso do Gastos Abertos!");
        session.send("Você pode encontrar a Carta nesse link: https://gastosabertos.org/participe/GastosAbertosCartaCompromisso.pdf");
        session.send("Mande uma mensagem lá no nosso grupo! Tá cheio de gente para ajudar!");
        session.endDialog();
        session.beginDialog('/welcomeBack');
    }
]);

module.exports = library;