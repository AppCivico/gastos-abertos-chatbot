
module.exports = {
	up(queryInterface, Sequelize) {
		return queryInterface.createTable('user_information_access_request', {
			id: {
				allowNull: false,
				autoIncrement: true,
				primaryKey: true,
				type: Sequelize.INTEGER,
			},
			user_id: {
				type: Sequelize.INTEGER,
				allowNull: false,
				references: {
					model: '"user"',
					key: 'id',
				},
				onUpdate: 'cascade',
				onDelete: 'cascade',
			},
			metadata: {
				type: Sequelize.JSON,
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
	down(queryInterface, Sequelize) {
		return queryInterface.dropTable('user_information_acess_request');
	},
};
