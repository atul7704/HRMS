'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('payrolls', {
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
      month: { type: Sequelize.INTEGER, allowNull: false },
      year: { type: Sequelize.INTEGER, allowNull: false },
      working_days: { type: Sequelize.INTEGER, defaultValue: 0 },
      present_days: { type: Sequelize.DECIMAL(5, 1), defaultValue: 0 },
      leave_days: { type: Sequelize.DECIMAL(5, 1), defaultValue: 0 },
      absent_days: { type: Sequelize.DECIMAL(5, 1), defaultValue: 0 },
      basic: { type: Sequelize.DECIMAL(10, 2), defaultValue: 0 },
      hra: { type: Sequelize.DECIMAL(10, 2), defaultValue: 0 },
      conveyance: { type: Sequelize.DECIMAL(10, 2), defaultValue: 0 },
      medical_allowance: { type: Sequelize.DECIMAL(10, 2), defaultValue: 0 },
      special_allowance: { type: Sequelize.DECIMAL(10, 2), defaultValue: 0 },
      bonus: { type: Sequelize.DECIMAL(10, 2), defaultValue: 0 },
      overtime_amount: { type: Sequelize.DECIMAL(10, 2), defaultValue: 0 },
      gross_salary: { type: Sequelize.DECIMAL(10, 2), defaultValue: 0 },
      pf_deduction: { type: Sequelize.DECIMAL(10, 2), defaultValue: 0 },
      esi_deduction: { type: Sequelize.DECIMAL(10, 2), defaultValue: 0 },
      tax_deduction: { type: Sequelize.DECIMAL(10, 2), defaultValue: 0 },
      other_deduction: { type: Sequelize.DECIMAL(10, 2), defaultValue: 0 },
      total_deduction: { type: Sequelize.DECIMAL(10, 2), defaultValue: 0 },
      net_salary: { type: Sequelize.DECIMAL(10, 2), defaultValue: 0 },
      status: { type: Sequelize.ENUM('pending', 'processed', 'paid'), defaultValue: 'pending' },
      paid_at: { type: Sequelize.DATE, allowNull: true },
      createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.addIndex('payrolls', ['employee_id', 'month', 'year'], { unique: true });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('payrolls');
  },
};