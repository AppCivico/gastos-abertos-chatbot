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

	down(queryInterface) {
		queryInterface.removeColumn('"user"', 'approved');
	},
};
