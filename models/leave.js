module.exports = (sequelize, DataTypes) => {
  const Leave = sequelize.define('Leave', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    employee_id: { type: DataTypes.INTEGER, allowNull: false },
    company_id: { type: DataTypes.INTEGER, allowNull: false },
    leave_type: {
      type: DataTypes.ENUM('casual', 'sick', 'paid', 'unpaid', 'maternity', 'paternity', 'other'),
      allowNull: false,
    },
    from_date: { type: DataTypes.DATEONLY, allowNull: false },
    to_date: { type: DataTypes.DATEONLY, allowNull: false },
    total_days: { type: DataTypes.DECIMAL(5, 1), allowNull: false },
    reason: { type: DataTypes.TEXT, allowNull: true },
    status: { type: DataTypes.ENUM('pending', 'approved', 'rejected'), defaultValue: 'pending' },
    approved_by: { type: DataTypes.INTEGER, allowNull: true },
    approved_at: { type: DataTypes.DATE, allowNull: true },
    rejection_reason: { type: DataTypes.STRING(255), allowNull: true },
  }, { tableName: 'leaves', timestamps: true });


  return Leave;
};