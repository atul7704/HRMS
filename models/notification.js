module.exports = (sequelize, DataTypes) => {
  const Notification = sequelize.define('Notification', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_type: { type: DataTypes.ENUM('admin', 'company', 'employee'), allowNull: false },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    title: { type: DataTypes.STRING(200), allowNull: false },
    message: { type: DataTypes.TEXT, allowNull: true },
    type: { type: DataTypes.STRING(50), allowNull: true },
    is_read: { type: DataTypes.BOOLEAN, defaultValue: false },
    reference_id: { type: DataTypes.INTEGER, allowNull: true },
    reference_type: { type: DataTypes.STRING(50), allowNull: true },
  }, { tableName: 'notifications', timestamps: true });

  return Notification;
};