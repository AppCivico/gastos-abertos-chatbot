
module.exports = (sequelize, DataTypes) => {
	const user = sequelize.define(
		'user', {
			name: DataTypes.STRING,
			occupation: DataTypes.STRING,
			email: DataTypes.STRING,
			birth_date: DataTypes.STRING,
			state: DataTypes.STRING,
			city: DataTypes.STRING,
			cellphone_number: DataTypes.STRING,
			approved: DataTypes.BOOLEAN,
			active: DataTypes.BOOLEAN,
			fb_id: DataTypes.STRING,
			fb_name: DataTypes.STRING,
			address: DataTypes.JSON,
			admin: DataTypes.BOOLEAN,
			session: DataTypes.JSON,
		},
		{
			classMethods: {
				associate(models) {
				// associations can be defined here
					user.belongsToMany(
						models.user_mission,
						{
							foreignKey: 'user_id',
							through: 'user_mission',
						} // eslint-disable-line comma-dangle
					);
				},
			},
			freezeTableName: true,
		} // eslint-disable-line comma-dangle
	);
	return user;
};
