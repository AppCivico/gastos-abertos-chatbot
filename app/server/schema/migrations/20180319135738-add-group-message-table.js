
module.exports = {
	up(queryInterface, Sequelize) {
		return queryInterface.createTable('group_message', {
			id: {
				allowNull: false,
				autoIncrement: true,
				primaryKey: true,
				type: Sequelize.INTEGER,
			},
			user_id: {
				type: Sequelize.INTEGER,
				allowNull: false,
			},
			user_group: {
				type: Sequelize.STRING,
				allowNull: false,
			},
			content: {
				type: Sequelize.STRING,
				allowNull: false,
			},
			image_url: {
				type: Sequelize.STRING,
			},
			number_sent: {
				type: Sequelize.INTEGER,
				allowNull: false,
			},
			createdAt: {
				type: Sequelize.DATE,
				allowNull: false,
			},
			updatedAt: {
				type: Sequelize.DATE,
				allowNull: false,
			},
		});
	},
	down(queryInterface) {
		return queryInterface.dropTable('group_message');
	},
};
