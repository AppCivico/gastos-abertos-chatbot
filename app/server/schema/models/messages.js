
module.exports = (sequelize, DataTypes) => {
	const messages = sequelize.define(
		'messages', {
			userAdress: DataTypes.INTEGER,
			missionID: DataTypes.INTEGER,
			msgSent: DataTypes.STRING,
			sentAlready: DataTypes.BOOLEAN,
			timeSent: DataTypes.DATE,
		},
		{
			freezeTableName: true,
		} // eslint-disable-line comma-dangle
	);
	return messages;
};
