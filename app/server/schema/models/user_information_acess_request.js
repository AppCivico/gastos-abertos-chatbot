
module.exports = (sequelize, DataTypes) => {
	const user_information_access_request = sequelize.define('user_information_acess_request', {
		user_id: DataTypes.INTEGER,
		metadata: DataTypes.JSON,
	}, {
		classMethods: {
			associate(models) {
				// associations can be defined here
			},
		},
	});
	return user_information_access_request;
};
