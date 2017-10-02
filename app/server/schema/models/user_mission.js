'use strict';
module.exports = function(sequelize, DataTypes) {
  var user_mission = sequelize.define('user_mission', {
    user_id: DataTypes.INTEGER,
    mission_id: DataTypes.INTEGER,
    completed: DataTypes.BOOLEAN,
    metadata: DataTypes.JSON
  }, {
    classMethods: {
      associate: function(models) {
        // associations can be defined here
        user_mission.belongsToMany(
          models.user,
          { foreignKey: 'user_id' }
        );
      }
    },
    freezeTableName: true,
  });
  return user_mission;
};