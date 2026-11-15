'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('employees', 'reset_otp', {
      type: Sequelize.STRING(10),
      allowNull: true,
    });
    
    await queryInterface.addColumn('employees', 'reset_otp_expiry', {
      type: Sequelize.DATE,
      allowNull: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('employees', 'reset_otp');
    await queryInterface.removeColumn('employees', 'reset_otp_expiry');
  }
};