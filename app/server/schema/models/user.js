'use strict';
module.exports = function(sequelize, DataTypes) {
  var user = sequelize.define('user', {
    name: DataTypes.STRING,
    occupation: DataTypes.STRING,
    email: DataTypes.STRING,
    birth_date: DataTypes.STRING,
    state: DataTypes.STRING,
    city: DataTypes.STRING,
    cellphone_number: DataTypes.STRING,
    approved: DataTypes.BOOLEAN,
    active: DataTypes.BOOLEAN,
    fb_id: DataTypes.STRING
  },
  {
    classMethods: {
      associate: function(models) {
        // associations can be defined here
        user.belongsToMany(
          models.user_mission,
          {
            foreignKey: 'user_id',
            through: 'user_mission'
          }
        );
      }
    },
    freezeTableName: true,
  });
  return user;
};