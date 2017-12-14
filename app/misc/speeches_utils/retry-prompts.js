const emoji = require('./emojis');

module.exports = {
	choice: `Desculpa ${emoji.disappointed}, não entendi a opção que você selecionou, pois por enquanto eu não entendo muito bem discurso livre apenas os botões.\n\nSelecione uma das opções abaixo`,
	email:
				[
					`${emoji.thinking.repeat(3)} Hummm. Não entendi o e-mail que você digitou. Vamos tentar novamente?`,
					`${emoji.thinking.repeat(3)} Hummm. Não entendi o e-mail que você digitou. O e-mail deve ter o seguinte formato: exemplo@exemplo.com`,
				],
	date:
				[
					`${emoji.thinking.repeat(3)} Hummm. Não entendi a data que você digitou. Vamos tentar novamente?`,
					`${emoji.thinking.repeat(3)} Hummm. Não entendi a data que você digitou. Não se esqueça que ela deve ter o seguinte formato: 01/01/2000`,
				],
	state:
				[
					`${emoji.thinking.repeat(3)} Hummm. Não entendi o estado que você digitou. Vamos tentar novamente?`,
					`${emoji.thinking.repeat(3)} Hummm. Não entendi o estado que você digitou. Ele dever apenas a sigla como por exemplo a sigla do estado onde eu fui criado: SP`,
				],
	cellphone:
				[
					`${emoji.thinking.repeat(3)} Hummm. Não entendi o telefone que você digitou. Vamos tentar novamente?`,
					`${emoji.thinking.repeat(3)} Hummm. Não entendi o telefone que você digitou. Siga o seguinte exemplo: 11988888888 ou 1188888888`,
				],
};
