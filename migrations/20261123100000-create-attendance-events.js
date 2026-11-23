'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('attendance_events', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      attendance_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'attendances', key: 'id' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' },
      employee_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'employees', key: 'id' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' },
      company_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'companies', key: 'id' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' },
      event_type: { type: Sequelize.ENUM('punch_in', 'punch_out'), allowNull: false },
      event_time: { type: Sequelize.TIME, allowNull: false },
      photo: { type: Sequelize.STRING(255), allowNull: false },
      createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    })
    await queryInterface.addIndex('attendance_events', ['attendance_id', 'event_type'])
  },
  async down(queryInterface) { await queryInterface.dropTable('attendance_events') },
}
