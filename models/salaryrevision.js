module.exports = (sequelize, DataTypes) => {
  const SalaryRevision = sequelize.define('SalaryRevision', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    employee_id: { type: DataTypes.INTEGER, allowNull: false },
    old_salary: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    new_salary: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    salary_structure: { type: DataTypes.JSON, allowNull: true },
    old_salary_structure: { type: DataTypes.JSON, allowNull: true },
    effective_from: { type: DataTypes.DATEONLY, allowNull: false },
    reason: { type: DataTypes.STRING(255), allowNull: true },
    approved_by: { type: DataTypes.INTEGER, allowNull: true },
  }, { tableName: 'salary_revisions', timestamps: true });



  return SalaryRevision;
};
