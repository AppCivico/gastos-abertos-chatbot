'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    queryInterface.changeColumn(
      '"user"',
      'birth_date',
      {
        type: Sequelize.STRING,
        allowNull: false,
      }
    )
  },
};
