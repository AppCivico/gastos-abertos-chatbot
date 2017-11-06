var emoji = require('./emojis');

module.exports = {
    first_mission: 
        {
            assign:
                [
                    "Nessa missão, a sua tarefa será realizar um mapeamento da existência e qualidade do portal de transparência do seu município." +
                    "\n\n\n\nE para concluir a missão basta selecionar a opção 'Processo de missões' no início e eu irei te fazer algumas perguntas sobre o portal."
                ],
            reference_transparency_portals:
                [
                    "\n\n\nVocê poderá utilizar esse dois portais de transparência como referência no Brasil:" +
                    "\n\nCuritiba - http://www.transparencia.curitiba.pr.gov.br/ .\n\nRecife - http://transparencia.recife.pe.gov.br/codigos/web/geral/home.php" +
                    "\n\n\nEles não são perfeitos, mas servem como referência para o trabalho de outros municípios."
                ],
            details:
                [
                    "A missão 1 consiste em avaliar se existe um portal de transparência em seu município e se ele possui algumas informações básicas." +
                    "\n\n\nPara concluir esta missão você precisará responder algumas perguntas que eu te farei ao iniciar o processo de conclusão."
                ],
            questions:
                [
                    "-Existência de um portal de transparência;\n\n\n" +
                    "-URL(link) do portal;\n\n\n" +
                    "-Dados de despesas e receitas;\n\n\n" +
                    "-Formatos de arquivo disponíveis para download dos dados;\n\n\n" +
                    "-Contratos assinados pela prefeitura;\n\n\n" +
                    "-Licitações\n\n\n"
                ]
        },
    second_mission:
        {
            assign:
                [
                    "Nossa segunda missão é o seguinte:\n\n" +
                    "- Avaliar alguns pontos bem mais detalhados do portal de transparência de seu município;\n\n" +
                    "- Protocolar um pedido de acesso à informação exigindo os dados ausentes."
                ]
        }
};   