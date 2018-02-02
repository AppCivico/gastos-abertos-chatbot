module.exports = {
	up(queryInterface, Sequelize) {
		queryInterface.addColumn(
			'"user"',
			'approved',
			{
				allowNull: false,
				defaultValue: true,
				type: Sequelize.BOOLEAN,
			} // eslint-disable-line comma-dangle
		);
	},

	down(queryInterface) {
		queryInterface.removeColumn('"user"', 'approved');
	},
};
