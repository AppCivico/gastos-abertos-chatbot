module.exports = {
	up(queryInterface, Sequelize) {
		queryInterface.addColumn(
			'"user"',
			'approved',
			{
				allowNull: false,
				defaultValue: true,
				type: Sequelize.BOOLEAN,
			},
		);
	},

	down(queryInterface, Sequelize) {
		queryInterface.removeColumn('"user"', 'approved');
	},
};
