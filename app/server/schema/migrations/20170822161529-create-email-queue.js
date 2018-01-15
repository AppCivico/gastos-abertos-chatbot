module.exports = {
	up(queryInterface, Sequelize) {
		return queryInterface.createTable('email_queue', {
			id: {
				allowNull: false,
				autoIncrement: true,
				primaryKey: true,
				type: Sequelize.INTEGER,
			},
			email: {
				type: Sequelize.STRING,
				allowNull: false,
			},
			sucess: {
				type: Sequelize.INTEGER,
				allowNull: false,
			},
			createdAt: {
				allowNull: false,
				type: Sequelize.DATE,
			},
			updatedAt: {
				allowNull: false,
				type: Sequelize.DATE,
			},
		});
	},
	down(queryInterface) {
		return queryInterface.dropTable('email_queue');
	},
};
