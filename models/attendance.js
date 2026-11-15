'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Attendance extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Attendance.init({
    employee_id: DataTypes.INTEGER,
    company_id: DataTypes.INTEGER,
    date: DataTypes.DATE,
    check_in: DataTypes.TIME,
    check_out: DataTypes.TIME,
    working_hours: DataTypes.DECIMAL,
    overtime_hours: DataTypes.DECIMAL,
    status: DataTypes.STRING,
    remarks: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'attendances',
  });
  return Attendance;
};