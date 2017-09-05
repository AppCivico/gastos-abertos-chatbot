'use strict';
module.exports = function(sequelize, DataTypes) {
  var mission = sequelize.define('mission', {
    code: DataTypes.INTEGER,
    name: DataTypes.STRING
  }, {
    classMethods: {
      associate: function(models) {
        // associations can be defined here
      }
    }
  });
  return mission;
};