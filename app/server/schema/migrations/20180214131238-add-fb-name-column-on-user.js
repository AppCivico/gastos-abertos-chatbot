module.exports = {
	up(queryInterface, Sequelize) {
		queryInterface.addColumn(
			'"user"',
			'fb_name',
			{
				type: Sequelize.STRING,
			} // eslint-disable-line comma-dangle
		);
	},

	down(queryInterface) {
		queryInterface.removeColumn('"user"', 'fb_name');
	},
};
