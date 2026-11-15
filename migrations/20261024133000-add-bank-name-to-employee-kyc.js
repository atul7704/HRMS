'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('employee_kyc', 'bank_name', {
      type: Sequelize.STRING(100),
      allowNull: true,
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('employee_kyc', 'bank_name');
  },
};
