'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('employee_kyc', {
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
      uan_pf: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      esi: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      bank_account: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      ifsc: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },
      pan: {
        type: Sequelize.STRING(15),
        allowNull: true,
      },
      aadhar_number: {
        type: Sequelize.STRING(20),
        allowNull: true,
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
    await queryInterface.dropTable('employee_kyc');
  },
};