module.exports = (sequelize, DataTypes) => {
  const Holiday = sequelize.define('Holiday', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    company_id: { type: DataTypes.INTEGER, allowNull: false },
    name: { type: DataTypes.STRING(150), allowNull: false },
    date: { type: DataTypes.DATEONLY, allowNull: false },
    description: { type: DataTypes.STRING(255), allowNull: true },
    type: {
      type: DataTypes.ENUM('public', 'national', 'festival', 'optional'),
      defaultValue: 'public',
    },
  }, { tableName: 'holidays', timestamps: true });


  return Holiday;
};