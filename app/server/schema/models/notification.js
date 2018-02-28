
module.exports = (sequelize, DataTypes) => {
	const notification = sequelize.define(
		'notification', {
			userID: DataTypes.INTEGER,
			missionID: DataTypes.INTEGER,
			msgSent: DataTypes.STRING,
			sentAlready: DataTypes.BOOLEAN,
			numberSent: DataTypes.INTEGER,
			timeSent: DataTypes.DATE,
		},
		{
			freezeTableName: true,
		} // eslint-disable-line comma-dangle
	);
	return notification;
};
