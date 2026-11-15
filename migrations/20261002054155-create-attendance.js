'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('attendances', {
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
      date: { type: Sequelize.DATEONLY, allowNull: false },
      check_in: { type: Sequelize.TIME, allowNull: true },
      check_out: { type: Sequelize.TIME, allowNull: true },
      working_hours: { type: Sequelize.DECIMAL(5, 2), defaultValue: 0 },
      overtime_hours: { type: Sequelize.DECIMAL(5, 2), defaultValue: 0 },
      status: {
        type: Sequelize.ENUM('present', 'absent', 'half_day', 'leave', 'holiday', 'week_off'),
        defaultValue: 'present',
      },
      remarks: { type: Sequelize.STRING(255), allowNull: true },
      createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.addIndex('attendances', ['employee_id', 'date'], { unique: true });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('attendances');
  },
};