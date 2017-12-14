
module.exports = {
	up(queryInterface, Sequelize) {
		queryInterface.bulkInsert('missions', [
			{
				code: 1,
				name: 'Diagnóstico do portal de transparência',
				createdAt: new Date(),
				updatedAt: new Date(),
			},
			{
				code: 2,
				name: 'Assinatura da carta compromisso',
				createdAt: new Date(),
				updatedAt: new Date(),
			},
			{
				code: 3,
				name: 'Pedido de acesso à informação',
				createdAt: new Date(),
				updatedAt: new Date(),
			},
		]);
	},

	down(queryInterface, Sequelize) {
		queryInterface.bulkInsert('missions', [
			{ code: 1 },
			{ code: 2 },
			{ code: 3 },
		]);
	},
};
