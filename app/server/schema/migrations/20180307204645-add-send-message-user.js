module.exports = {
	up(queryInterface, Sequelize) {
		// sendMessage is used to check if that person can send direct messages to user
		// It can be only turned on with the admin panel
		queryInterface.addColumn(
			'"user"',
			'sendMessage',
			{
				type: Sequelize.BOOLEAN,
				allowNull: false,
				defaultValue: false,
			} // eslint-disable-line comma-dangle
		);
	},

	down(queryInterface) {
		queryInterface.removeColumn('"user"', 'sendMessage');
	},
};
