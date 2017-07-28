var Sequelize = require('sequelize');

const sequelize = new Sequelize('postgres://postgres@127.0.0.1:5432/gastos_abertos_dev');

sequelize
  .authenticate()
  .then(() => {
    console.log('Connection has been established successfully.');
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
  }); 