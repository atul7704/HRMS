module.exports = (sequelize, DataTypes) => {
  const ActivityLog = sequelize.define('ActivityLog', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_type: { type: DataTypes.ENUM('admin', 'company', 'employee'), allowNull: false },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    action: { type: DataTypes.STRING(100), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    ip_address: { type: DataTypes.STRING(45), allowNull: true },
    user_agent: { type: DataTypes.STRING(255), allowNull: true },
  }, { tableName: 'activity_logs', timestamps: true, updatedAt: false });

  return ActivityLog;
};