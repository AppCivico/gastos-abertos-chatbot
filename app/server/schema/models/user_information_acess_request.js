
module.exports = (sequelize, DataTypes) => {
	const userInformationAccessRequest = sequelize.define('user_information_acess_request', {
		user_id: DataTypes.INTEGER,
		metadata: DataTypes.JSON,
	}, {
		classMethods: {
			associate() {
				// associations can be defined here
			},
		},
	});
	return userInformationAccessRequest;
};
