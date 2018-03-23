module.exports = (sequelize, DataTypes) => {
	// This table stores data from try catch error
	const userMessage = sequelize.define(
		'error_log', {
			user_id: DataTypes.INTEGER, // id of the user involved
			user_name: DataTypes.STRING, // name of the user involved
			error_message: DataTypes.STRING, // error from the try catch block
			dialog_stack: DataTypes.JSON, // user's dialog stack at the time of the error
			response: DataTypes.STRING, // admin response
			admin_id: DataTypes.INTEGER, // id of admin involved
			resolved: DataTypes.BOOLEAN, // admin can mark as resolved without actually answering the user
		},
		{
			freezeTableName: true,
		} // eslint-disable-line comma-dangle
	);
	return userMessage;
};
