module.exports = {
	up(queryInterface, Sequelize) {
		// group the user belongs to(so the user knows who's sending a message)
		queryInterface.addColumn(
			'"user"',
			'group',
			{
				type: Sequelize.STRING,
				allowNull: false,
				defaultValue: 'Cidadão',
			} // eslint-disable-line comma-dangle
		);
	},

	down(queryInterface) {
		queryInterface.removeColumn('"user"', 'group');
	},
};
