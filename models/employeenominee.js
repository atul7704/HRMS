module.exports = (sequelize, DataTypes) => {
  const EmployeeNominee = sequelize.define('EmployeeNominee', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    employee_id: { type: DataTypes.INTEGER, allowNull: false },

    name: { type: DataTypes.STRING(150), allowNull: false },
    address: { type: DataTypes.TEXT, allowNull: true },
    dob: { type: DataTypes.DATEONLY, allowNull: true },
    relation: { type: DataTypes.STRING(50), allowNull: true },
  }, {
    tableName: 'employee_nominees',
    timestamps: true,
  });

 

  return EmployeeNominee;
};