'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('leaves', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      employee_id: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'employees', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE',
      },
      company_id: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'companies', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE',
      },
      leave_type: {
        type: Sequelize.ENUM('casual', 'sick', 'paid', 'unpaid', 'maternity', 'paternity', 'other'),
        allowNull: false,
      },
      from_date: { type: Sequelize.DATEONLY, allowNull: false },
      to_date: { type: Sequelize.DATEONLY, allowNull: false },
      total_days: { type: Sequelize.DECIMAL(5, 1), allowNull: false },
      reason: { type: Sequelize.TEXT, allowNull: true },
      status: { type: Sequelize.ENUM('pending', 'approved', 'rejected'), defaultValue: 'pending' },
      approved_by: {
        type: Sequelize.INTEGER, allowNull: true,
        references: { model: 'employees', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'SET NULL',
      },
      approved_at: { type: Sequelize.DATE, allowNull: true },
      rejection_reason: { type: Sequelize.STRING(255), allowNull: true },
      createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('leaves');
  },
};