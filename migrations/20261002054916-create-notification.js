'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('notifications', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      user_type: { type: Sequelize.ENUM('admin', 'company', 'employee'), allowNull: false },
      user_id: { type: Sequelize.INTEGER, allowNull: false },
      title: { type: Sequelize.STRING(200), allowNull: false },
      message: { type: Sequelize.TEXT, allowNull: true },
      type: { type: Sequelize.STRING(50), allowNull: true },
      is_read: { type: Sequelize.BOOLEAN, defaultValue: false },
      reference_id: { type: Sequelize.INTEGER, allowNull: true },
      reference_type: { type: Sequelize.STRING(50), allowNull: true },
      createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('notifications');
  },
};