module.exports = (sequelize, DataTypes) => sequelize.define('AttendanceEvent', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  attendance_id: { type: DataTypes.INTEGER, allowNull: false },
  employee_id: { type: DataTypes.INTEGER, allowNull: false },
  company_id: { type: DataTypes.INTEGER, allowNull: false },
  event_type: { type: DataTypes.ENUM('punch_in', 'punch_out'), allowNull: false },
  event_time: { type: DataTypes.TIME, allowNull: false },
  photo: { type: DataTypes.STRING(255), allowNull: false },
}, { tableName: 'attendance_events', timestamps: true })
