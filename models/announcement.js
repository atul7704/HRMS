module.exports = (sequelize, DataTypes) => {
  const Announcement = sequelize.define('Announcement', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    company_id: { type: DataTypes.INTEGER, allowNull: false },
    title: { type: DataTypes.STRING(200), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    priority: { type: DataTypes.ENUM('low', 'medium', 'high'), defaultValue: 'medium' },
    published_at: { type: DataTypes.DATE, allowNull: true },
    expires_at: { type: DataTypes.DATE, allowNull: true },
    status: { type: DataTypes.ENUM('draft', 'published', 'expired'), defaultValue: 'draft' },
  }, { tableName: 'announcements', timestamps: true });

  Announcement.associate = (models) => {
    Announcement.belongsTo(models.Company, { foreignKey: 'company_id', as: 'company' });
  };

  return Announcement;
};