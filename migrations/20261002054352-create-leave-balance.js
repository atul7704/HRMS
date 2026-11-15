'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('leave_balances', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      employee_id: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'employees', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE',
      },
      leave_type: {
        type: Sequelize.ENUM('casual', 'sick', 'paid', 'unpaid', 'maternity', 'paternity', 'other'),
        allowNull: false,
      },
      total_allocated: { type: Sequelize.DECIMAL(5, 1), defaultValue: 0 },
      used: { type: Sequelize.DECIMAL(5, 1), defaultValue: 0 },
      remaining: { type: Sequelize.DECIMAL(5, 1), defaultValue: 0 },
      year: { type: Sequelize.INTEGER, allowNull: false },
      createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.addIndex('leave_balances', ['employee_id', 'leave_type', 'year'], { unique: true });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('leave_balances');
  },
};