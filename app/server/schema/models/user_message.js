module.exports = (sequelize, DataTypes) => {
	// This table stores data from each message send between users and admins
	const userMessage = sequelize.define(
		'user_message', {
			user_id: DataTypes.INTEGER, // id of the involved
			user_name: DataTypes.STRING, // name of the user
			user_address: DataTypes.JSON, // address of the user
			content: DataTypes.STRING, // what user(or admin) wrote
			response: DataTypes.STRING, // admin response
			admin_id: DataTypes.INTEGER, // id of admin involved
			answered: DataTypes.BOOLEAN, // admin can mark as answered without actually answering
		},
		{
			freezeTableName: true,
		} // eslint-disable-line comma-dangle
	);
	return userMessage;
};
