// const path = require('path');
// require('dotenv').config({
//   path: path.resolve(__dirname, '../.env'),
// });

// const { Sequelize } = require('sequelize');

// const config = {
//   development: {
//     username: process.env.DB_USER,
//     password: process.env.DB_PASSWORD,
//     database: process.env.DB_NAME,
//     host: process.env.DB_HOST,
//     port: process.env.DB_PORT || 3306,
//     dialect: process.env.DB_DIALECT || 'mysql',
//     logging: false,
//   },
// };


// const sequelize = new Sequelize(
//   config.development.database,
//   config.development.username,
//   config.development.password,
//   {
//     host: config.development.host,
//     port: config.development.port,
//     dialect: config.development.dialect,
//     logging: config.development.logging,
//   }
// );

// module.exports = sequelize;          
// module.exports.development = config.development; 




const path = require('path');
require('dotenv').config({
  path: path.resolve(__dirname, '../.env'),
});

const { Sequelize } = require('sequelize');

const dbSettings = {
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 3306,
  dialect: process.env.DB_DIALECT || 'mysql',
  logging: false,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  },
};

const config = {
  development: dbSettings,
  production: dbSettings,
};

const sequelize = new Sequelize(
  dbSettings.database,
  dbSettings.username,
  dbSettings.password,
  {
    host: dbSettings.host,
    port: dbSettings.port,
    dialect: dbSettings.dialect,
    logging: dbSettings.logging,
    dialectOptions: dbSettings.dialectOptions,
  }
);

module.exports = sequelize;
module.exports.development = config.development;
module.exports.production = config.production;
