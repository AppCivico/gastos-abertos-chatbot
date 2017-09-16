const library = new builder.Library('firstMissionAssign');

bot.library(require('../contact'));
bot.library(require('./conclusion'));
bot.library(require('./details'));

User        = require('../../server/schema/models').user;
UserMission = require('../../server/schema/models').user_mission;

const MoreInformations = "Mais detalhes";
const Conclusion       = "Conclusão da missão";
const Contact          = "Entrar em contato";
const Restart          = "Ir para o início";
const Yes              = "Sim";
const No               = "Não";

var retryPrompts = require('../../misc/speeches_utils/retry-prompts');
var texts        = require("../../misc/speeches_utils/big-texts");
var emoji        = require("../../misc/speeches_utils/emojis");

let user;
let user_mission;

library.dialog('/', [
    (session, args) => {
        user         = args.user;
        user_mission = args.user_mission;

        if (session.message.address.channelId == 'facebook') {
            User.update({
                fb_id: session.message.sourceEvent.sender.id
            }, {
                where: {
                    id: user.id
                },
                returning: true,
            })
            .then(result => {
                console.log("User updated sucessfuly");
            })
            .catch(e => {
                console.log(e);
                throw e;
            });
        }

        UserMission.create({
            user_id: user.id,
            mission_id: 1,
        })
        .then(UserMission => {
            session.send("Vamos lá! Que comece o processo de missões!");
            session.send(texts.first_mission.assign);

            builder.Prompts.choice(session,
                'Quer o link para alguns portais de transparência para usar como referência?',
                [Yes, No],
                {
                    listStyle: builder.ListStyle.button,
                    retryPrompt: retryPrompts.choice
                }
            );
        })
        .catch(e => {
            console.log("Error creating user mission" + e);
            session.send("Oooops, tive um problema ao iniciar suas missões, tente novamente mais tarde e entre em contato conosco.");
            session.endDialogWithResult({ resumed: builder.ResumeReason.notCompleted });
            throw e;
        });
    },
    (session, args) => {
        msg = new builder.Message(session);
        msg.sourceEvent({
            facebook: {
                attachment:{
                  type:"template",
                  payload:{
                    template_type:"generic",
                    elements:[{
                        title:"Olá! Eu sou o Guaxi!",
                        subtitle:"O chatbot mais transparente e engajado da internet! Venha conversar comigo!",
                        image_url:"https://gallery.mailchimp.com/cdabeff22c56cd4bd6072bf29/images/8e84d7d3-bba7-43be-acac-733dd6712f78.png",
                        item_url: "http://m.me/gastosabertos",
                        buttons:[{
                            type:"element_share"
                          }]
                        }]
                    }
                }
            }
        });

        switch(args.response.entity) {
            case Yes:
                session.send(texts.first_mission.reference_transparency_portals);
                break;
            case No:
                session.send("Okay! Mas qualquer dúvida pode entrar em contato com a gente aqui do Gastos Abertos tá?");
                break;
        }

        User.count({
                where: {
                    state: user.state
                }
            })
            .then(count => {
                if (count < 10 && count != 1) {
                    session.send("E eu vou te dar uma tarefa extra " + emoji.grinningface + emoji.sunglass + "\n\nAtualmente há " + count + " líderes no seu estado. Vamos aumentar este número para 10 líderes?");
                    session.send("Para alcançar esse número pedimos que você convide seus amigos para participar desse nosso segundo ciclo do Gastos Abertos!");
                    if (session.message.address.channelId == 'facebook') {
                        session.send(msg);
                    }
                }
                else if (count < 10 && count == 1) {
                    session.send("E eu vou te dar uma tarefa extra " + emoji.grinningface + emoji.sunglass + "\n\nAtualmente há apenas você de líder no seu estado. Vamos aumentar este número para 10 líderes?");
                    session.send("Compartilhe isto com os seus amigos! Assim nós teremos mais força para incentivar a transparência em seu estado!");
                    if (session.message.address.channelId == 'facebook') {
                        session.send(msg);
                    }
                }

                builder.Prompts.choice(session,
            'Posso te ajudar com mais alguma coisa?',
            [MoreInformations, Conclusion, Contact, Restart],
            {
                listStyle: builder.ListStyle.button,
                retryPrompt: retryPrompts.choice
            }
        );
            })
            .catch(e => {
                console.log("Error" + e);
                session.send("Oooops, tive um problema ao iniciar suas missões, tente novamente mais tarde e entre em contato conosco.");
                session.endDialogWithResult({ resumed: builder.ResumeReason.notCompleted });
                throw e;
            });
    },

    (session, args) => {
        switch(args.response.entity) {
            case MoreInformations:
                session.endDialog();
                session.beginDialog('firstMissionDetails:/')
                break;
            case Contact:
                session.beginDialog('contact:/');
                break;
            case Restart:
                session.endDialog();
                session.beginDialog('/');
                break;
            case Conclusion:
                session.endDialog();
                session.beginDialog(
                    'firstMissionConclusion:/',
                    {
                        user:         user,
                        user_mission: user_mission
                    }
                );
                break;
        }
    }
]).cancelAction('cancelar', null, { matches: /^cancelar/i });

module.exports = library;