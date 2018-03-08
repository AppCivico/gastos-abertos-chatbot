module.exports = {
	up(queryInterface, Sequelize) {
		// receiveMessage is used for checking if we have permission to send the messages to users
		// false => don't send messages
		// true => send messages
		// null => we don't if users want to receive messages, but we'll send them anyway
		queryInterface.addColumn(
			'"user"',
			'receiveMessage',
			{
				type: Sequelize.BOOLEAN,
			} // eslint-disable-line comma-dangle
		);
	},

	down(queryInterface) {
		queryInterface.removeColumn('"user"', 'receiveMessage');
	},
};
