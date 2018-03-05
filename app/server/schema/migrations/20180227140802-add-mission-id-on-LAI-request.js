module.exports = {
	up(queryInterface, Sequelize) {
		queryInterface.addColumn(
			'"user_information_access_request"',
			'isMission', // checks if request was generated as part of a mission
			{
				allowNull: false,
				defaultValue: false,
				type: Sequelize.BOOLEAN,
			} // eslint-disable-line comma-dangle
		);
		queryInterface.addColumn(
			'"user_information_access_request"',
			'missionID', // stores the id of the mission, in case the request was generated as part of a mission
			{
				allowNull: true,
				type: Sequelize.INTEGER,
			} // eslint-disable-line comma-dangle
		);
	},

	down(queryInterface) {
		queryInterface.removeColumn('"user_information_access_request"', 'isMission');
		queryInterface.removeColumn('"user_information_access_request"', 'missionID');
	},
};
