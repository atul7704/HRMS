'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('employees', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      employee_id: {
        type: Sequelize.STRING(20),
        allowNull: true,
        unique: true,
      },
      company_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'companies', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING(150),
        allowNull: false,
        unique: true,
      },
      password: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      phone: {
        type: Sequelize.STRING(15),
        allowNull: true,
      },
      profile_image: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      gender: {
        type: Sequelize.ENUM('male', 'female', 'other'),
        allowNull: true,
      },
      dob: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      father_name: {
        type: Sequelize.STRING(150),
        allowNull: true,
      },
      relation: {
        type: Sequelize.ENUM('father', 'spouse'),
        allowNull: true,
      },
      marital_status: {
        type: Sequelize.ENUM('single', 'married', 'divorced', 'widowed'),
        allowNull: true,
      },
      designation: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      department: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      location: {
        type: Sequelize.STRING(150),
        allowNull: true,
      },
      client_id: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      date_of_joining: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM('active', 'inactive'),
        defaultValue: 'active',
      },
      last_login: {
        type: Sequelize.DATE,
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
    await queryInterface.dropTable('employees');
  },
};