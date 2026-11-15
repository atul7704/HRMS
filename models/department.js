module.exports = (sequelize, DataTypes) => {
  const Department = sequelize.define('Department', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    company_id: { type: DataTypes.INTEGER, allowNull: false },
    name: { type: DataTypes.STRING(100), allowNull: false },
    description: { type: DataTypes.STRING(255), allowNull: true },
    status: { type: DataTypes.ENUM('active', 'inactive'), defaultValue: 'active' },
  }, { tableName: 'departments', timestamps: true });


  return Department;
};