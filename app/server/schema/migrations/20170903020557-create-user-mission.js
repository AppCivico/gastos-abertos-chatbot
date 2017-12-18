
module.exports = {
	up(queryInterface, Sequelize) {
		return queryInterface.createTable('user_mission', {
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
			mission_id: {
				type: Sequelize.INTEGER,
				allowNull: false,
				references: {
					model: 'missions',
					key: 'id',
				},
				onUpdate: 'cascade',
				onDelete: 'cascade',
			},
			completed: {
				type: Sequelize.BOOLEAN,
				allowNull: false,
				defaultValue: false,
			},
			metadata: {
				type: Sequelize.JSON,
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
		return queryInterface.dropTable('user_mission');
	},
};
