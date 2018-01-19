const emoji = require('node-emoji');

module.exports = {
	choice: `Desculpe ${emoji.get('dizzy_face').repeat(2)}, não entendi a opção que você selecionou, pois, por enquanto, ` +
	'eu não entendo muito bem discurso livre, apenas os botões.\n\nSelecione uma das opções abaixo:',
	email:
				[
					`${emoji.get('thinking_face').repeat(3)} Hummm. Não entendi o e-mail que você digitou. O e-mail deve ter o seguinte formato: exemplo@exemplo.com`,
				],
	date:
				[
					`${emoji.get('thinking_face').repeat(3)} Hummm. Não entendi a data que você digitou. Não se esqueça que ela deve ter o seguinte formato: 01/01/2000`,
				],
	state:
				[
					`${emoji.get('thinking_face').repeat(3)} Hummm. Não entendi o estado que você digitou. Digite apenas a sigla como, por exemplo, a sigla do estado` +
					' onde eu fui criado: SP',
				],
	cellphone:
				[
					`${emoji.get('thinking_face').repeat(3)} Hummm. Não entendi o telefone que você digitou. Siga o seguinte exemplo: 11988888888 ou 1188888888`,
				],
};
