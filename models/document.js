module.exports = (sequelize, DataTypes) => {
  const Document = sequelize.define('Document', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    company_id: { type: DataTypes.INTEGER, allowNull: false },
    employee_id: { type: DataTypes.INTEGER, allowNull: true },
    document_type: { type: DataTypes.STRING(100), allowNull: false },
    document_name: { type: DataTypes.STRING(150), allowNull: false },
    document_url: { type: DataTypes.STRING(255), allowNull: false },
    uploaded_by: { type: DataTypes.INTEGER, allowNull: true },
  }, { tableName: 'documents', timestamps: true });

  Document.associate = (models) => {
    Document.belongsTo(models.Company, { foreignKey: 'company_id', as: 'company' });
    Document.belongsTo(models.Employee, { foreignKey: 'employee_id', as: 'employee' });
  };

  return Document;
};