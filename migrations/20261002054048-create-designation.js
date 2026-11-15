'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('designations', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      company_id: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'companies', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE',
      },
      department_id: {
        type: Sequelize.INTEGER, allowNull: true,
        references: { model: 'departments', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'SET NULL',
      },
      name: { type: Sequelize.STRING(100), allowNull: false },
      description: { type: Sequelize.STRING(255), allowNull: true },
      status: { type: Sequelize.ENUM('active', 'inactive'), defaultValue: 'active' },
      createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('designations');
  },
};