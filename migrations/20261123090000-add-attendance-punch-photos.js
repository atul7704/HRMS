'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('attendances', 'check_in_photo', { type: Sequelize.STRING(255), allowNull: true });
    await queryInterface.addColumn('attendances', 'check_out_photo', { type: Sequelize.STRING(255), allowNull: true });
  },
  async down(queryInterface) {
    await queryInterface.removeColumn('attendances', 'check_out_photo');
    await queryInterface.removeColumn('attendances', 'check_in_photo');
  },
};
