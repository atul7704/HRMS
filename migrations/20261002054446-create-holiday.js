'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('holidays', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      company_id: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'companies', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE',
      },
      name: { type: Sequelize.STRING(150), allowNull: false },
      date: { type: Sequelize.DATEONLY, allowNull: false },
      description: { type: Sequelize.STRING(255), allowNull: true },
      type: {
        type: Sequelize.ENUM('public', 'national', 'festival', 'optional'),
        defaultValue: 'public',
      },
      createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('holidays');
  },
};