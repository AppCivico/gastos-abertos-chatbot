bot.library(require('./contact'));

var request    = require('request');
var builder    = require('botbuilder');
var pdf        = require('html-pdf');
var fs         = require('fs');
var Base64File = require('js-base64-file');
 
var emoji        = require('../misc/speeches_utils/emojis');
var retryPrompts = require('../misc/speeches_utils/retry-prompts');

User        = require('../server/schema/models').user;
UserMission = require('../server/schema/models').user_mission;

const library = new builder.Library('informationAccessRequest');

const Yes      = "Sim";
const No       = "Não";
const HappyYes = "Vamos lá!";
const Confirm  = "Beleza!";

let user, user_mission, name;

let itens = [];

var options = { 
    "border": {
        "top": "5em",
        "right": "3.5em",
        "bottom": "3.5em",
        "left": "3em"
    },

    "font-size": "10px"
};

const generatedRequest = new Base64File;
const path             = '/tmp/';
let file = "";

var apiUri  = process.env.MAILCHIMP_API_URI;
var apiUser = process.env.MAILCHIMP_API_USER;
var apiKey  = process.env.MAILCHIMP_API_KEY;

var headers = {
    'content-type': 'application/json'
};

library.dialog('/', [
    (session, args) => {
        if (args && args.user && args.user_mission) {
            user         = args.user;
            user_mission = args.user_mission;
            session.send("Esse é um processo bem extenso e tem bastante conteúdo. Caso você tenha qualquer tipo de dúvidas nos mande!\n\nO grupo de lideranças é muito bom para isso! (https://chat.whatsapp.com/Flm0oYPVLP0KfOKYlUidXS)");
            session.send("Além disso você pode a qualquer momento digitar 'cancelar' e eu te levo para o início");
        } else {
            session.send("Você está gerando um pedido de acesso à informação avulso.");
        }
        // else if (session.message.address.channelId == 'facebook' && !args) {
        //     var fbId = session.message.sourceEvent.sender.id;

        //     User.findOne({
        //         where: {
        //             email: email,
        //             fb_id: fbId
        //         }
        //     }).then(User => {
        //         user = User.dataValues;

        //         builder.Prompts.choice(session,
        //             user.name + "você está gerando um ",
        //             [Yes, No],
        //             {
        //                 listStyle: builder.ListStyle.button,
        //                 retryPrompt: retryPrompts.choice
        //             }
        //         );

        //     });
        // }

        session.replaceDialog('/looseRequest');
    }
]).cancelAction('cancelar', null, { matches: /^cancelar/i });

library.dialog('/looseRequest', [
    (session) => {
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
                break;
        }
        builder.Prompts.choice(session,
            "Seu município identifica de onde vêm os recursos que ele recebe? \n- ele tem que identificar, pelo menos, se os recursos vêm da União, do estado, da cobrança de impostos ou de empréstimos.",
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
                itens.push("<p> - Disponibilização sobre receitas, despesas e endividamento público, nos termos da Lei Complementar 131, de 27 de maio de 2009, e demais regras aplicáveis;</p>");
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
                itens.push("<p> - Disponibilização sobre remuneração de cada um dos agentes públicos, individualizada – o modelo do Portal da Transparência do Governo Federal é um exemplo;</p>");
                break;
        }

        builder.Prompts.choice(session,
            "O portal de transparência disponibiliza: a relação de pagamentos de diárias, a acquisição de passagens aéreas e adiantamento de despesas?",
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
                itens.push("<p> - Disponibilização da relação de pagamentos de diárias, aquisição de passagens aéreas (destino e motivo da viagem) e adiantamento de despesas</p>");
                break;
        }

        builder.Prompts.choice(session,
            "O portal de transparência disponibiliza as despesas realizadas com cartões corporativos em nome da prefeitura?",
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
                itens.push("<p> - Disponibilização das despesas realizadas com cartões corporativos em nome da prefeitura</p>");
                break;
        }

        builder.Prompts.choice(session,
            "O portal de transparência disponibiliza os valores referentes às verbas de representação, de gabinete e reembolsáveis de qualquer natureza?",
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
                itens.push("<p> - Disponibilização dos valores referentes às verbas de representação, de gabinete e reembolsáveis de qualquer natureza</p>");
                break;
        }

        builder.Prompts.choice(session,
            "O portal de transparência disponibiliza os editais de licitação, dos procedimentos licitatórios, com indicação das licitações abertas, em andamento e já realizadas, dos contratos e aditivos, e dos convênios celebrados?",
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
                itens.push("<p> - Disponibilização dos editais de licitação, dos procedimentos licitatórios, com indicação das licitações abertas, em andamento e já realizadas, dos contratos e aditivos, e dos convênios celebrados</p>");
                break;
        }

        builder.Prompts.choice(session,
            "O portal de transparência realiza a disponibilização da íntegra dos procedimentos de dispensa e inexigibilidade de licitações, com respectivas fundamentações?",
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
                itens.push("<p> - Disponibilização da íntegra dos procedimentos de dispensa e inexigibilidade de licitações, com respectivas fundamentações</p>");
                break;
        }

        builder.Prompts.choice(session,
            "O portal de transparência realiza a disponibilização do controle de estoque da prefeitura, com lista de entradas e saídas de bens patrimoniais, além da relação de cessões, permutas e doação de bens?",
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
                itens.push("<p> - Disponibilização do controle de estoque da prefeitura, com lista de entradas e saídas de bens patrimoniais, além da relação de cessões, permutas e doação de bens</p>");
                break;
        }

        builder.Prompts.choice(session,
            "O portal de transparência realiza a disponibilização das notas-fiscais eletrônicas que deram origem a pagamentos?",
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
                itens.push("<p> - Disponibilização do controle de estoque da prefeitura, com lista de entradas e saídas de bens patrimoniais, além da relação de cessões, permutas e doação de bens</p>");
                break;
        }

        builder.Prompts.choice(session,
            "O portal de transparência realiza a disponibilização das notas-fiscais eletrônicas que deram origem a pagamentos?",
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
                itens.push("<p> - Disponibilização das notas-fiscais eletrônicas que deram origem a pagamentos</p>");
                break;
        }

        builder.Prompts.choice(session,
            "O portal de transparência realiza a disponibilização do plano plurianual; da lei de diretrizes orçamentárias; da lei orçamentária?",
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
                itens.push("<p> - Disponibilização do plano plurianual; da lei de diretrizes orçamentárias; da lei orçamentária</p>");
                break;
        }

        builder.Prompts.choice(session,
            "O portal de transparência realiza a disponibilização dos relatórios Resumido de Execução Orçamentária; Relatórios de Gestão Fiscal; Atas das Audiências Públicas de Avaliação de Metas Fiscais, com a abordagem das seguintes questões:\
            \n\ni) Demonstrativo de Aplicação na Área de Educação;\
            \n\nii) Demonstrativo de Aplicação na Área de Saúde;\
            \n\niii) Demonstrativo de Aplicação na Área Social?",
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
                itens.push("<p> - Disponibilização dos relatórios Resumido de Execução Orçamentária; Relatórios de Gestão Fiscal; Atas das Audiências Públicas de Avaliação de Metas Fiscais, com a abordagem das seguintes questões:\
            \n\ni) Demonstrativo de Aplicação na Área de Educação;\
            \n\nii) Demonstrativo de Aplicação na Área de Saúde;\
            \n\niii) Demonstrativo de Aplicação na Área Social");
                break;
        }

        builder.Prompts.choice(session,
            "O portal de transparência realiza a disponibilização dos extratos de conta única?",
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
                itens.push("<p> - Disponibilização dos extratos de conta única</p>");
                break;
        }

        builder.Prompts.choice(session,
            "O portal de transparência realiza a disponibilização das despesas em um único arquivo em formato legível por máquina incluindo as colunas: função, subfunção, programa, ação, valor liquidado e valor empenhado?",
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
                itens.push("<p> - Disponibilização das despesas em um único arquivo em formato legível por máquina incluindo as colunas: função, subfunção, programa, ação, valor liquidado e valor empenhado\n\n</p>");
                break;
        }

        builder.Prompts.text(session, "Qual é o seu nome completo?");
    },

    (session, args) => {
        name = args.response;

        var html = '<p style="font-size:7pt">Eu, ' + name + ', com fundamento na Lei 12.527, de 18 de novembro de 2011, e na Lei Complementar 131, de 27 de maio de 2009, venho por meio deste pedido solicitar o acesso às seguintes informações, que devem ser disponibilizadas com periodicidade diária ou mensal (quando aplicável) em página oficial na internet desde o momento em que a Lei Complementar 131/2009 passou a vigorar:</p><div style="font-size:7pt"">'
        + itens.join("") +
        '</div><div style="font-size:7pt"><p>Caso a disponibilização desde a vigência da Lei Complementar 131/2009 não seja possível, solicito que a impossibilidade de apresentação de informações seja motivada, sob pena de responsabilidade, e que a série histórica mais longa disponível à Prefeitura das informações seja disponibilizada em página oficial na internet e que acompanhe a resposta a esta solicitação.</p></div>';

        pdf.create(html).toStream((err, stream) => {
            var pdf = stream.pipe(fs.createWriteStream('/tmp/' + name + 'LAI.pdf'));
            file = pdf.path;

            console.log(file);
            builder.Prompts.choice(session,
                "Muito bem! Acabamos! Vamos gerar seu pedido?",
                [HappyYes],
                {
                    listStyle: builder.ListStyle.button,
                    retryPrompt: retryPrompts.choice
                }
            );
        });

        itens.length = 0;
    },

    (session, args) => {
        switch(args.response.entity) {
            case HappyYes:
                session.beginDialog('/generateRequest');
                break;
        }
    }

]).cancelAction('cancelar', null, { matches: /^cancelar/i });

library.dialog('/generateRequest', [
    (session) => {
        var data = generatedRequest.loadSync(path, file.slice(5));
        data = JSON.stringify(data);

        // Uploading the PDF to the MailChimp
        var dataString = '{"name":"' + name + 'LAI.pdf" , "file_data":' + data + '}'

        var options = {
            url: apiUri,
            method: 'POST',
            headers: headers,
            body: dataString,
            auth: {
                'user': apiUser,
                'pass': apiKey
            }
        };

        function callback(error, response, body) {
            if (!error && response.statusCode == 200) {
                var obj = JSON.parse(body);
                console.log(obj.full_size_url);

                msg = new builder.Message(session);
                msg.sourceEvent({
                    facebook: {
                        attachment: {
                            type: "template",
                            payload: {
                                template_type: "generic",
                                elements: [
                                    {
                                        title: "Pedido de acesso à informação gerado pelo Guaxi para " + name,
                                        buttons: [{
                                            type: "web_url",
                                            url: obj.full_size_url,
                                            title: "Ver seu pedido"
                                        }]
                                    }
                                ]
                            }
                        }
                    }
                });
                session.send(msg);
                if (user && user_mission) {
                    UserMission.update(
                        { metadata: { request_generated: 1 } },
                        {
                            where: {
                                user_id: user.id,
                                mission_id: 2,
                                completed: false
                            },
                            returning: true
                        }
                    )
                    .then(result => {
                        console.log(result + "Mission updated sucessfuly");
                        session.send("Ae!! Conseguimos! Demorou mas chegamos ao final");
                        session.send("Muito bem! Agora basta protocolar o pedido de acesso à informação no portal de transparência de sua prefeitura, ou levar esse pedido em formato físico e protocola-lo.");
                        session.send("No entanto o poder público tem um tempo limite de 20 dias para responder o seu pedido");
                        session.send("E precisamos dessa resposta para completar nossa segunda missão");
                        builder.Prompts.choice(session,
                            "Então pode ficar tranquilo que te chamo quando for liberada a conclusão ;D",
                            [ Confirm ],
                            {
                                listStyle: builder.ListStyle.button,
                                retryPrompt: retryPrompts.choice
                            }
                        );
                    })
                    .catch(e => {
                        console.log("Error updating mission" + e);
                        session.send('Oooops...Tive um problema ao atualizar sua missão. Tente novamente mais tarde.');
                        session.endDialogWithResult({ resumed: builder.ResumeReason.notCompleted });
                        throw e;
                    });
                } else {
                    builder.Prompts.choice(session,
                        "Muito bem! Agora basta protocolar o pedido de acesso à informação no portal de transparência de sua prefeitura, ou levar esse pedido em formato físico e protocola-lo.",
                        [ Confirm ],
                        {
                            listStyle: builder.ListStyle.button,
                            retryPrompt: retryPrompts.choice
                        }
                    );
                }
            }
        }

        request(options,callback);
        fs.unlink(file);
    },

    (session, args) => {
        switch (args.response.entity) {
            case Confirm:
                session.endDialog();
                session.replaceDialog('/');
                break;
        }
    }
]).cancelAction('cancelar', null, { matches: /^cancelar/i });


module.exports = library;