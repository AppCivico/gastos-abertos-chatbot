module.exports = {
	up(queryInterface, Sequelize) {
		return queryInterface.createTable('error_log', {
			id: {
				allowNull: false,
				autoIncrement: true,
				primaryKey: true,
				type: Sequelize.INTEGER,
			},
			user_id: {
				type: Sequelize.INTEGER,
			},
			error_message: {
				type: Sequelize.STRING,
			},
			dialog_stack: {
				type: Sequelize.JSON,
			},
			response: {
				type: Sequelize.STRING,
			},
			admin_id: {
				type: Sequelize.INTEGER,
			},
			resolved: {
				type: Sequelize.BOOLEAN,
				defaultValue: false,
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
		return queryInterface.dropTable('error_log');
	},
};
