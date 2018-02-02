module.exports = {
	up(queryInterface, Sequelize) {
		queryInterface.changeColumn(
			'"user"',
			'birth_date',
			{
				type: Sequelize.STRING,
				allowNull: false,
			} // eslint-disable-line comma-dangle
		);
	},
};
