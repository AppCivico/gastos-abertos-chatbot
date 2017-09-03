'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    queryInterface.addColumn(
      '"user"',
      'approved',
      {
        allowNull: false,
        defaultValue: true,
        type: Sequelize.BOOLEAN
      }
    );
  },

  down: function (queryInterface, Sequelize) {
    queryInterface.removeColumn('"user"', 'approved');
  }
};
