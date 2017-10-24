bot.library(require('./contact'));

var request    = require('request');
var builder    = require('botbuilder');
var pdf        = require('html-pdf');
var fs         = require('fs');
var Base64File = require('js-base64-file');
 
var emoji        = require('../misc/speeches_utils/emojis');
var retryPrompts = require('../misc/speeches_utils/retry-prompts');

User = require('../server/schema/models').user;

const library = new builder.Library('informationAccessRequest');

const Yes      = "Sim";
const No       = "Não";
const HappyYes = "Vamos lá!";

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
        // if (args.user && args.user_mission) {
        //     user         = args.user;
        //     user_mission = args.user_mission;

        //     session.replaceDialog('/userPartOfTheGame');
        // } else {
            session.replaceDialog('/looseRequest');
        // }
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
                itens.push("<p> - Disponibilização sobre receitas, despesas e endividamento público, nos termos da Lei Complementar 131, de 27 de maio de 2009, e demais regras aplicáveis;\n\n</p>");
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

        var html = '<p style="font-size:7pt">Eu, ' + session.dialogData.name + ', com fundamento na Lei 12.527, de 18 de novembro de 2011, e na Lei Complementar 131, de 27 de maio de 2009, venho por meio deste pedido solicitar o acesso às seguintes informações, que devem ser disponibilizadas com periodicidade diária ou mensal (quando aplicável) em página oficial na internet desde o momento em que a Lei Complementar 131/2009 passou a vigorar:</p><div style="font-size:7pt"">'
        + itens.join("") +
        '</div><div style="font-size:7pt"><p>Caso a disponibilização desde a vigência da Lei Complementar 131/2009 não seja possível, solicito que a impossibilidade de apresentação de informações seja motivada, sob pena de responsabilidade, e que a série histórica mais longa disponível à Prefeitura das informações seja disponibilizada em página oficial na internet e que acompanhe a resposta a esta solicitação.</p></div>';

        pdf.create(html).toStream((err, stream) => {
            var pdf = stream.pipe(fs.createWriteStream('/tmp/' + session.dialogData.name + 'LAI.pdf'));
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
                            type: "file",
                            payload: {
                                template_type: "generic",
                                elements: [
                                    {
                                        title: "Pedido de acesso à informação gerado pelo Guaxi para" + name,
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
            }
        }

        request(options,callback);
        fs.unlink(file);
    }
]).cancelAction('cancelar', null, { matches: /^cancelar/i });


module.exports = library;