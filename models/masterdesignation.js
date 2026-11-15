module.exports = (sequelize, DataTypes) => sequelize.define('MasterDesignation', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  department_id: { type: DataTypes.INTEGER, allowNull: true },
  name: { type: DataTypes.STRING(100), allowNull: false },
  description: { type: DataTypes.STRING(255), allowNull: true },
  status: { type: DataTypes.ENUM('active', 'inactive'), allowNull: false, defaultValue: 'active' },
}, { tableName: 'master_designations', timestamps: true });
