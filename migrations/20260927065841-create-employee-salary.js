'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('employee_salaries', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      employee_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'employees', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      basic: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0,
      },
      hra: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0,
      },
      pf_basic: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0,
      },
      conveyance: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0,
      },
      medical_allowance: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0,
      },
      eps_basic: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0,
      },
      special_allowance: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0,
      },
      fixed_bonus: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0,
      },
      esic_applicable: {
        type: Sequelize.ENUM('yes', 'no'),
        defaultValue: 'no',
      },
      total: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0,
      },
      bonus_rate: {
        type: Sequelize.DECIMAL(5, 2),
        defaultValue: 0,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('employee_salaries');
  },
};