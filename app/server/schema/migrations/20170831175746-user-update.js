module.exports = {
	up(queryInterface, Sequelize) {
		queryInterface.addColumn(
			'"user"',
			'active',
			{
				allowNull: false,
				defaultValue: false,
				type: Sequelize.BOOLEAN,
			},
		);
	},

	down(queryInterface) {
		queryInterface.removeColumn('"user"', 'active');
	},
};
