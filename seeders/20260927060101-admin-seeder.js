'use strict';

const bcrypt = require('bcryptjs');

module.exports = {
  async up(queryInterface, Sequelize) {
    const email = 'tbsingh13jan@gmail.com';

    const existing = await queryInterface.rawSelect(
      'admins',
      { where: { email } },
      ['id']
    );

    if (existing) {
      console.log('⚠️  Admin already exists, skipping...');
      return;
    }

    const hashedPassword = await bcrypt.hash('Admin@123', 10);

    await queryInterface.bulkInsert('admins', [
      {
        name: 'Tej Bahadur Singh',
        email,
        password: hashedPassword,
        phone: '9821791187',
        profile_image: null,
        status: 'active',
        last_login: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    console.log('✅ Default admin created:');
    console.log('   Email    : tbsingh13jan@gmail.com');
    console.log('   Password : Admin@123');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('admins', { email: 'tbsingh13jan@gmail.com' });
  },
};