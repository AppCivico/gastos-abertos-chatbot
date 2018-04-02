module.exports = {
	up(queryInterface, Sequelize) {
		queryInterface.changeColumn(
			'"user_message"',
			'content',
			{
				type: Sequelize.TEXT,
				allowNull: true,
			} // eslint-disable-line comma-dangle
		);

		queryInterface.changeColumn(
			'"user_message"',
			'response',
			{
				type: Sequelize.TEXT,
				allowNull: true,
			} // eslint-disable-line comma-dangle
		);

		queryInterface.changeColumn(
			'"notification"',
			'msgSent',
			{
				type: Sequelize.TEXT,
				allowNull: true,
			} // eslint-disable-line comma-dangle
		);

		queryInterface.changeColumn(
			'"group_message"',
			'content',
			{
				type: Sequelize.TEXT,
				allowNull: true,
			} // eslint-disable-line comma-dangle
		);

		queryInterface.changeColumn(
			'"group_message"',
			'image_url',
			{
				type: Sequelize.TEXT,
				allowNull: true,
			} // eslint-disable-line comma-dangle
		);

		queryInterface.changeColumn(
			'"error_log"',
			'error_message',
			{
				type: Sequelize.TEXT,
				allowNull: true,
			} // eslint-disable-line comma-dangle
		);

		queryInterface.changeColumn(
			'"error_log"',
			'response',
			{
				type: Sequelize.TEXT,
				allowNull: true,
			} // eslint-disable-line comma-dangle
		);
	},


	down: (queryInterface, Sequelize) => {
		queryInterface.changeColumn(
			'"user_message"',
			'content',
			{
				type: Sequelize.STRING,
				allowNull: true,
			} // eslint-disable-line comma-dangle
		);

		queryInterface.changeColumn(
			'"user_message"',
			'response',
			{
				type: Sequelize.STRING,
				allowNull: true,
			} // eslint-disable-line comma-dangle
		);

		queryInterface.changeColumn(
			'"notification"',
			'msgSent',
			{
				type: Sequelize.STRING,
				allowNull: true,
			} // eslint-disable-line comma-dangle
		);

		queryInterface.changeColumn(
			'"group_message"',
			'content',
			{
				type: Sequelize.STRING,
				allowNull: true,
			} // eslint-disable-line comma-dangle
		);

		queryInterface.changeColumn(
			'"group_message"',
			'image_url',
			{
				type: Sequelize.STRING,
				allowNull: true,
			} // eslint-disable-line comma-dangle
		);

		queryInterface.changeColumn(
			'"error_log"',
			'error_message',
			{
				type: Sequelize.STRING,
				allowNull: true,
			} // eslint-disable-line comma-dangle
		);

		queryInterface.changeColumn(
			'"error_log"',
			'response',
			{
				type: Sequelize.STRING,
				allowNull: true,
			} // eslint-disable-line comma-dangle
		);
	},
};
