const library = new builder.Library('secondMissionConclusion');

let answers = {};

var retryPrompts = require('../../misc/speeches_utils/retry-prompts');
var texts        = require("../../misc/speeches_utils/big-texts");
var emoji        = require("../../misc/speeches_utils/emojis");

User        = require('../../server/schema/models').user;
UserMission = require('../../server/schema/models').user_mission;



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
            "Pelo o que vi aqui você está na primeira missão, vamos conclui-la?",
            [Yes, No, MoreInformations],
            {
                listStyle: builder.ListStyle.button,
                retryPrompt: retryPrompts.choice
            }
        );

    }
]);

module.exports = library;