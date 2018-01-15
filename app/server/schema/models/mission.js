
module.exports = (sequelize, DataTypes) => {
	const mission = sequelize.define('mission', {
		code: DataTypes.INTEGER,
		name: DataTypes.STRING,
	}, {
		classMethods: {
			associate(models) {
				// associations can be defined here
				mission.belongsToMany(
					models.user_mission,
					{
						foreignKey: 'mission_id',
						through: 'user_mission',
					} // eslint-disable-line comma-dangle
				);
			},
		},
	});
	return mission;
};
