'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('salary_revisions', 'salary_structure', {
      type: Sequelize.JSON,
      allowNull: true,
    });

    await queryInterface.addColumn('payrolls', 'salary_revision_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'salary_revisions', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });

    await queryInterface.addIndex('salary_revisions', ['employee_id', 'effective_from'], {
      name: 'salary_revisions_employee_effective_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('salary_revisions', 'salary_revisions_employee_effective_idx');
    await queryInterface.removeColumn('payrolls', 'salary_revision_id');
    await queryInterface.removeColumn('salary_revisions', 'salary_structure');
  },
};
