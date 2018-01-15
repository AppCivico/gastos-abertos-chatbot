module.exports = {
	up(queryInterface, Sequelize) {
		queryInterface.addColumn(
			'"user"',
			'fb_id',
			{
				type: Sequelize.STRING,
			},
		);
	},

	down(queryInterface) {
		queryInterface.removeColumn('"user"', 'fb_id');
	},
};
