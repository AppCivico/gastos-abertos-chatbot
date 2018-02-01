module.exports = {
	up(queryInterface, Sequelize) {
		queryInterface.addColumn(
			'"user"',
			'active',
			{
				allowNull: false,
				defaultValue: false,
				type: Sequelize.BOOLEAN,
			} // eslint-disable-line comma-dangle
		);
	},

	down(queryInterface) {
		queryInterface.removeColumn('"user"', 'active');
	},
};
