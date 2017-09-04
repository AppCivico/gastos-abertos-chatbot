'use strict';
module.exports = function(sequelize, DataTypes) {
  var user_mission = sequelize.define('user_mission', {
    user_id: DataTypes.INTEGER,
    mission_id: DataTypes.INTEGER,
    metadata: DataTypes.JSON
  }, {
    classMethods: {
      associate: function(models) {
        // associations can be defined here
      }
    }
  });
  return user_mission;
};