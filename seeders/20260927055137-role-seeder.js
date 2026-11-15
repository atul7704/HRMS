'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const roles = [
      { name: 'super_admin', slug: 'super-admin', description: 'Super Administrator with full access' },
      { name: 'company',     slug: 'company',     description: 'Company account holder' },
      { name: 'employee',    slug: 'employee',    description: 'Company employee' },
    ];

    for (const role of roles) {
      const existing = await queryInterface.rawSelect(
        'roles',
        { where: { slug: role.slug } },
        ['id']
      );

      if (!existing) {
        await queryInterface.bulkInsert('roles', [
          { ...role, createdAt: new Date(), updatedAt: new Date() },
        ]);
      }
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('roles', {
      slug: ['super-admin', 'company', 'employee'],
    });
  },
};