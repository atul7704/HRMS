module.exports = (sequelize, DataTypes) => {
  const EmployeeFamily = sequelize.define('EmployeeFamily', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    employee_id: { type: DataTypes.INTEGER, allowNull: false },

    name: { type: DataTypes.STRING(150), allowNull: false },
    relation: { type: DataTypes.STRING(50), allowNull: true },
    dob: { type: DataTypes.DATEONLY, allowNull: true },
    address: { type: DataTypes.TEXT, allowNull: true },
    aadhar: { type: DataTypes.STRING(20), allowNull: true },
  }, {
    tableName: 'employee_families',
    timestamps: true,
  });

  EmployeeFamily.associate = (models) => {
    EmployeeFamily.belongsTo(models.Employee, {
      foreignKey: 'employee_id',
      as: 'employee',
    });
  };

  return EmployeeFamily;
};