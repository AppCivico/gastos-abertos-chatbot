'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    queryInterface.addColumn(
      '"user"',
      'fb_id',
      {
        type: Sequelize.STRING
      }
    );
  },

  down: function (queryInterface, Sequelize) {
    queryInterface.removeColumn('"user"', 'fb_id');
  }
};
