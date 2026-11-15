'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('documents', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      company_id: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'companies', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE',
      },
      employee_id: {
        type: Sequelize.INTEGER, allowNull: true,
        references: { model: 'employees', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'SET NULL',
      },
      document_type: { type: Sequelize.STRING(100), allowNull: false },
      document_name: { type: Sequelize.STRING(150), allowNull: false },
      document_url: { type: Sequelize.STRING(255), allowNull: false },
      uploaded_by: { type: Sequelize.INTEGER, allowNull: true },
      createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('documents');
  },
};