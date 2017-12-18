
module.exports = (sequelize, DataTypes) => {
	const userMission = sequelize.define('user_mission', {
		user_id: DataTypes.INTEGER,
		mission_id: DataTypes.INTEGER,
		completed: DataTypes.BOOLEAN,
		metadata: DataTypes.JSON,
	}, {
		classMethods: {
			associate(models) {
				// associations can be defined here
				userMission.belongsToMany(
					models.user,
					{ foreignKey: 'user_id' } // eslint-disable-line comma-dangle
				);
			},
		},
		freezeTableName: true,
	});
	return userMission;
};
