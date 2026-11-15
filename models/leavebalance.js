module.exports = (sequelize, DataTypes) => {
  const LeaveBalance = sequelize.define('LeaveBalance', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    employee_id: { type: DataTypes.INTEGER, allowNull: false },
    leave_type: {
      type: DataTypes.ENUM('casual', 'sick', 'paid', 'unpaid', 'maternity', 'paternity', 'other'),
      allowNull: false,
    },
    total_allocated: { type: DataTypes.DECIMAL(5, 1), defaultValue: 0 },
    used: { type: DataTypes.DECIMAL(5, 1), defaultValue: 0 },
    remaining: { type: DataTypes.DECIMAL(5, 1), defaultValue: 0 },
    year: { type: DataTypes.INTEGER, allowNull: false },
  }, { tableName: 'leave_balances', timestamps: true });



  return LeaveBalance;
};