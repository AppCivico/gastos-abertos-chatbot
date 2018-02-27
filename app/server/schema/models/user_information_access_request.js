
module.exports = (sequelize, DataTypes) => {
	const userInformationAccessRequest = sequelize.define('user_information_access_request', {
		user_id: DataTypes.INTEGER,
		metadata: DataTypes.JSON,
		isMission: DataTypes.BOOLEAN,
		missionID: DataTypes.INTEGER,
	}, {
		classMethods: {
			associate(models) {
				// associations can be defined here
				userInformationAccessRequest.belongsToMany(
					models.user,
					{ foreignKey: 'user_id' } // eslint-disable-line comma-dangle
				);
			},
		},
		freezeTableName: true,
	});
	return userInformationAccessRequest;
};
