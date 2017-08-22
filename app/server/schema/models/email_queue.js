'use strict';
module.exports = function(sequelize, DataTypes) {
  var email_queue = sequelize.define('email_queue', {
    email: DataTypes.STRING,
    sucess: DataTypes.INTEGER
  }, {
    classMethods: {
      associate: function(models) {
        // associations can be defined here
      }
    }
  });
  return email_queue;
};