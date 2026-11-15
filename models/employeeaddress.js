module.exports = (sequelize, DataTypes) => {
  const EmployeeAddress = sequelize.define('EmployeeAddress', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    employee_id: { type: DataTypes.INTEGER, allowNull: false },

    address_type: {
      type: DataTypes.ENUM('present', 'permanent', 'other'),
      defaultValue: 'present',
    },
    address: { type: DataTypes.TEXT, allowNull: true },
    district: { type: DataTypes.STRING(100), allowNull: true },
    state: { type: DataTypes.STRING(100), allowNull: true },
    pin: { type: DataTypes.STRING(10), allowNull: true },
    country: { type: DataTypes.STRING(100), defaultValue: 'India' },
  }, {
    tableName: 'employee_addresses',
    timestamps: true,
  });



  return EmployeeAddress;
};