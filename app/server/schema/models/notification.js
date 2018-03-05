
module.exports = (sequelize, DataTypes) => {
	const notification = sequelize.define(
		'notification', {
			userID: DataTypes.INTEGER, // user's primary key
			missionID: DataTypes.INTEGER, // mission type
			msgSent: DataTypes.STRING,	// the message that will/was sent
			sentAlready: DataTypes.BOOLEAN, // alse=message will me sent
			// true=sent alredy or there's no need to send it anymore(user finished mission)
			numberSent: DataTypes.INTEGER, // number of msg sent(useful for requestTimer)
			timeSent: DataTypes.DATE, // timestamp of last sent message
		},
		{
			freezeTableName: true,
		} // eslint-disable-line comma-dangle
	);
	return notification;
};
