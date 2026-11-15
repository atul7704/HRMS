module.exports = (sequelize, DataTypes) => sequelize.define('MasterBank', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(100), allowNull: false, unique: true },
  status: { type: DataTypes.ENUM('active', 'inactive'), allowNull: false, defaultValue: 'active' },
}, { tableName: 'master_banks', timestamps: true });
