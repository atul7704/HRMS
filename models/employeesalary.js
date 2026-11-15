module.exports = (sequelize, DataTypes) => {
  const EmployeeSalary = sequelize.define('EmployeeSalary', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    employee_id: { type: DataTypes.INTEGER, allowNull: false },

    basic: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    hra: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    pf_basic: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    conveyance: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    medical_allowance: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    eps_basic: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    special_allowance: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    fixed_bonus: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    esic_applicable: { type: DataTypes.ENUM('yes', 'no'), defaultValue: 'no' },
    total: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    bonus_rate: { type: DataTypes.DECIMAL(5, 2), defaultValue: 0 },
  }, {
    tableName: 'employee_salaries',
    timestamps: true,
  });



  return EmployeeSalary;
};