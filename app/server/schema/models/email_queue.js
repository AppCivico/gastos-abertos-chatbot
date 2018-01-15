
module.exports = (sequelize, DataTypes) => {
	const emaiQueue = sequelize.define('email_queue', {
		email: DataTypes.STRING,
		sucess: DataTypes.INTEGER,
	}, {
		classMethods: {
			associate() {
				// associations can be defined here
			},
		},
	});
	return emaiQueue;
};
