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

	down(queryInterface, Sequelize) {
		queryInterface.removeColumn('"user"', 'fb_id');
	},
};
