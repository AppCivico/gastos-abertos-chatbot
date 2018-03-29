module.exports = {
	up(queryInterface, Sequelize) {
		return queryInterface.createTable('user_message', {
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
			user_name: {
				type: Sequelize.STRING,
				allowNull: false,
			},
			user_address: {
				type: Sequelize.JSON,
				allowNull: false,
			},
			content: {
				type: Sequelize.STRING,
				allowNull: false,
			},
			response: {
				type: Sequelize.STRING,
			},
			admin_id: {
				type: Sequelize.INTEGER,
			},
			answered: {
				type: Sequelize.BOOLEAN,
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
		return queryInterface.dropTable('user_message');
	},
};
