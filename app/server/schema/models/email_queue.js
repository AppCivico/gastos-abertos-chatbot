
module.exports = function (sequelize, DataTypes) {
	const email_queue = sequelize.define('email_queue', {
		email: DataTypes.STRING,
		sucess: DataTypes.INTEGER,
	}, {
		classMethods: {
			associate(models) {
				// associations can be defined here
			},
		},
	});
	return email_queue;
};
