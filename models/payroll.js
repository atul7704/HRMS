module.exports = (sequelize, DataTypes) => {
  const Payroll = sequelize.define('Payroll', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    employee_id: { type: DataTypes.INTEGER, allowNull: false },
    company_id: { type: DataTypes.INTEGER, allowNull: false },
    salary_revision_id: { type: DataTypes.INTEGER, allowNull: true },
    month: { type: DataTypes.INTEGER, allowNull: false },
    year: { type: DataTypes.INTEGER, allowNull: false },
    working_days: { type: DataTypes.INTEGER, defaultValue: 0 },
    present_days: { type: DataTypes.DECIMAL(5, 1), defaultValue: 0 },
    leave_days: { type: DataTypes.DECIMAL(5, 1), defaultValue: 0 },
    absent_days: { type: DataTypes.DECIMAL(5, 1), defaultValue: 0 },
    basic: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    hra: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    conveyance: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    medical_allowance: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    special_allowance: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    fixed_bonus: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    bonus: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    overtime_amount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    gross_salary: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    pf_deduction: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    esi_deduction: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    tax_deduction: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    other_deduction: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    total_deduction: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    net_salary: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    status: { type: DataTypes.ENUM('pending', 'processed', 'paid'), defaultValue: 'pending' },
    paid_at: { type: DataTypes.DATE, allowNull: true },
  }, { tableName: 'payrolls', timestamps: true });



  return Payroll;
};
