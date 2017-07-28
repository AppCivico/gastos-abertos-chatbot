'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {

    return queryInterface.createTable(
      '"user"',
      {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        name: {
          type: Sequelize.STRING,
          allowNull: false
        },
        email: {
          type: Sequelize.STRING,
          allowNull: false
        },
        birth_date: {
          type: Sequelize.DATE,
          allowNull: false
        },
        state: {
          type: Sequelize.STRING,
          allowNull: false
        },
        city: {
          type: Sequelize.STRING,
          allowNull: false
        },
        cellphone_number: {
          type: Sequelize.STRING,
          allowNull: false
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('NOW()')
        },
      },
      {
        charset: 'utf8'
      }
    )
  },

  down: function (queryInterface, Sequelize) {
    return queryInterface.dropTable('user');
  }
};
