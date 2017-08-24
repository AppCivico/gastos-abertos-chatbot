var builder           = require('botbuilder');
var GoogleSpreadsheet = require('google-spreadsheet');
var async             = require('async');
const mailer = require('../server/mailer/mailer.js');

User = require('../server/schema/models').user;

const library = new builder.Library('gameSignUp');

const emoji_thinking = "\uD83E\uDD14";
const emoji_clap     = "\uD83D\uDC4F";
const emoji_smile    = "\uD83E\uDD17";
const emoji_sunglass = "\uD83D\uDE0E";

var doc = new GoogleSpreadsheet(process.env.GOOGLE_SPREADSHEET_ID);
var sheet;

library.dialog('/', [
    (session) => {
        session.sendTyping();
        session.send("Tenho o maior respeito pela sua privacidade e tomarei todo cuidado com seus dados. Se tiver dúvidas, confira os termos de uso do Gastos Abertos: https://gastosabertos.org/termos .");
        builder.Prompts.text(session, "Qual é o seu nome completo?");
    },
    (session, args) => {
        session.dialogData.fullName = args.response;
        session.sendTyping();
        session.beginDialog('validators:email', {
            prompt: "Qual é o seu e-mail?",
            retryPrompt: [
                emoji_thinking.repeat(3) + "Hummm. Não entendi o e-mail que você digitou. Vamos tentar novamente?",
                emoji_thinking.repeat(3) + "Hummm. Não entendi o e-mail que você digitou. O e-mail deve ter o seguinte formato: exemplo@exemplo.com"
            ],
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

        session.dialogData.email = args.response;
        session.sendTyping();

        User.count({
            where: {
                email: session.dialogData.email
            }
        })
        .then(count => {
            if (count != 0) {
                session.send("Você já está cadastrado companheiro! " + emoji_sunglass + "Verifique se você recebeu minha mensagem em seu e-mail.\n\n\nEu a enviei para o seguinte e-mail: " + session.dialogData.email + ".");
                session.endDialog();
                return;
            } else {
                session.sendTyping();
                session.beginDialog('validators:date', {
                prompt: "Qual é a sua data de nascimento?",
                retryPrompt: [
                    emoji_thinking.repeat(3) + "Hummm. Não entendi a data que você digitou. Vamos tentar novamente?",
                    emoji_thinking.repeat(3) + "Hummm. Não entendi a data que você digitou. Não se esqueça que ela deve ter o seguinte formato: 01/01/2000"
                ],
                maxRetries: 10
            });
            }
        });
    },
    (session, args) => {
        if (args.resumed) {
            session.sendTyping();
            session.send('Você tentou inserir uma data inválida muitas vezes. Tente novamente mais tarde.');
            session.endDialogWithResult({ resumed: builder.ResumeReason.notCompleted });
            return;
        }

        session.dialogData.birthDate = args.response;
        session.sendTyping();
        session.beginDialog('validators:state', {
            prompt: "Qual é o estado(sigla) que você mora?",
            retryPrompt: [
                emoji_thinking.repeat(3) + "Hummm. Não entendi o estado que você digitou. Vamos tentar novamente?",
                emoji_thinking.repeat(3) + "Hummm. Não entendi o estado que você digitou. Ele dever apenas a sigla como por exemplo a sigla do estado onde eu fui criado: SP",
            ],
            maxRetries: 10
        });
    },
    (session, args) => {
        if (args.resumed) {
            session.sendTyping();
            session.send('Você tentou inserir um estado inválido muitas vezes. Tente novamente mais tarde.');
            session.endDialogWithResult({ resumed: builder.ResumeReason.notCompleted });
            return;
        }

        session.dialogData.state = args.response;
        session.sendTyping();
        builder.Prompts.text(session, "Qual é o município que você representará?");
    },
    (session, args) => {
        session.dialogData.city = args.response;
        session.sendTyping();
        session.send("Ufa! Não desanime, parceiro. Faltam apenas 2 perguntas para finalizar sua inscrição. Vamos lá!");
        session.beginDialog('validators:cellphone', {
            prompt: "Qual é o seu número de telefone celular? Não esqueça de colocar o DDD.",
            retryPrompt: [
                emoji_thinking.repeat(3) + "Hummm. Não entendi o telefone que você digitou. Vamos tentar novamente?",
                emoji_thinking.repeat(3) + "Hummm. Não entendi o telefone que você digitou. Siga o seguinte exemplo: 11988888888 ou 1188888888",
            ],
            maxRetries: 10
        });
    },
    (session, args) => {
        if (args.resumed) {
            session.sendTyping();
            session.send('Você tentou inserir um número de telefone celular inválido muitas vezes. Tente novamente mais tarde.');
            session.endDialogWithResult({ resumed: builder.ResumeReason.notCompleted });
            return;
        }

        session.dialogData.cellphoneNumber = args.response;
        session.sendTyping();
        builder.Prompts.text(session, "Qual a sua ocupação?");
    },
    (session, args) => {
        session.dialogData.occupation = args.response;

        var user = {
            name: session.dialogData.fullName,
            email: session.dialogData.email,
            birth_date: session.dialogData.birthDate,
            state: session.dialogData.state,
            city: session.dialogData.city,
            cellphone_number: session.dialogData.cellphoneNumber,
            occupation: session.dialogData.occupation
        };

        User.create({ 
            name: user.name,
            email: user.email,
            birth_date: user.birth_date,
            state: user.state,
            city: user.city,
            cellphone_number: user.cellphone_number,
            occupation: user.occupation 
        })
        .then(function(User) {
            console.log('User created sucessfully');

            mailer.listofemails.push(session.dialogData.email);
            mailer.massMailer();

            async.series([
                //Comment this whole block if you're not feeding a Google Spreadsheet
                function setAuth(step)  {
                    // This is where you insert your JSON credentials file
                    var creds = require('./Gastos-abertos-spreadsheet-b1c4c355e003.json');
                    doc.useServiceAccountAuth(creds, step);
                },

                function addEntry(step) {
                    doc.addRow(process.env.GOOGLE_WORKSHEET_ID, user, function(err, row) {
                        step();
                    });
                }
            ]);

            session.send("Muito bom, parceiro! Finalizamos sua inscrição.");
            session.send("Nossa equipe vai enviar em seu email a confirmação deste cadastro.");
            session.send("Enquanto isso, nossa próxima tarefa é convidar mais pessoas para o 2º Ciclo Gastos Abertos.\n\n\nSegue link para compartilhamento: https://www.facebook.com/messages/t/gastosabertos.\n\n\nAté a próxima missão!");
            session.endDialogWithResult({ resumed: builder.ResumeReason.completed });
            return User;
        })
        .catch(e => {
            console.log("Error creating user");
            session.send('Oooops...Tive um problema ao criar seu cadastro. Tente novamente mais tarde.');
            session.endDialogWithResult({ resumed: builder.ResumeReason.notCompleted });
            throw e;
        });
    },
]).cancelAction('cancelar', null, { matches: /^cancelar/i });

module.exports = library;