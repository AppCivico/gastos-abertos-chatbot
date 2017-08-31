'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    queryInterface.addColumn(
      '"user"',
      'active',
      {
        allowNull: true,
        defaultValue: false,
        type: Sequelize.BOOLEAN
      }
    );
  },

  down: function (queryInterface, Sequelize) {
    queryInterface.removeColumn('"user"', 'active');
  }
};
