'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('salary_revisions', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      employee_id: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'employees', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE',
      },
      old_salary: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      new_salary: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      effective_from: { type: Sequelize.DATEONLY, allowNull: false },
      reason: { type: Sequelize.STRING(255), allowNull: true },
      approved_by: {
        type: Sequelize.INTEGER, allowNull: true,
        references: { model: 'employees', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'SET NULL',
      },
      createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('salary_revisions');
  },
};