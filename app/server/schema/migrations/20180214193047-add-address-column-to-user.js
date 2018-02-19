module.exports = {
	up(queryInterface, Sequelize) {
		// address is used for sending proactive messages to the users
		queryInterface.addColumn(
			'"user"',
			'address',
			{
				type: Sequelize.JSON,
			} // eslint-disable-line comma-dangle
		);
	},

	down(queryInterface) {
		queryInterface.removeColumn('"user"', 'address');
	},
};
