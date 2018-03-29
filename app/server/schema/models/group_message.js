module.exports = (sequelize, DataTypes) => {
	// This table stores data from each message send by groups/admins
	const groupMessage = sequelize.define(
		'group_message', {
			user_id: DataTypes.INTEGER,
			user_group: DataTypes.STRING,
			content: DataTypes.STRING,
			image_url: DataTypes.STRING,
			number_sent: DataTypes.INTEGER,
		},
		{
			classMethods: {
				associate(models) {
				// associations can be defined here
					groupMessage.belongsToOne(
						models.iser,
						{
							foreignKey: 'user_id',
							through: 'user',
						} // eslint-disable-line comma-dangle
					);
				},
			},
			freezeTableName: true,
		} // eslint-disable-line comma-dangle
	);
	return groupMessage;
};
