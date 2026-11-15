module.exports = (sequelize, DataTypes) => {
  const EmployeeKyc = sequelize.define('EmployeeKyc', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    employee_id: { type: DataTypes.INTEGER, allowNull: false },

    uan_pf: { type: DataTypes.STRING(50), allowNull: true },
    esi: { type: DataTypes.STRING(50), allowNull: true },
    bank_account: { type: DataTypes.STRING(50), allowNull: true },
    bank_name: { type: DataTypes.STRING(100), allowNull: true },
    ifsc: { type: DataTypes.STRING(20), allowNull: true },
    pan: { type: DataTypes.STRING(15), allowNull: true },
    aadhar_number: { type: DataTypes.STRING(20), allowNull: true },
  }, {
    tableName: 'employee_kyc',
    timestamps: true,
  });



  return EmployeeKyc;
};
