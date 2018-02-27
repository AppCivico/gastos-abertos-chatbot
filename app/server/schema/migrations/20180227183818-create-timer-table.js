module.exports = {
	up: (queryInterface, Sequelize) => queryInterface.createTable('notification', {
		id: {
			allowNull: false,
			autoIncrement: true,
			primaryKey: true,
			type: Sequelize.INTEGER,
		},
		userID: {
			allowNull: false,
			type: Sequelize.INTEGER,
		},
		missionID: {
			allowNull: false,
			type: Sequelize.INTEGER,
		},
		msgSent: {
			allowNull: true,
			type: Sequelize.STRING,
		},
		sentAlready: {
			allowNull: false,
			defaultValue: false,
			type: Sequelize.STRING,
		},
		timeSent: {
			allowNull: true,
			type: Sequelize.DATE,
		},
		createdAt: {
			allowNull: false,
			type: Sequelize.DATE,
		},
		updatedAt: {
			allowNull: false,
			type: Sequelize.DATE,
		},
	}),

	down(queryInterface) {
		return queryInterface.dropTable('notification');
	},
};
