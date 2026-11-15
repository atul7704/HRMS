'use strict';

const banks = [
  'State Bank of India', 'HDFC Bank', 'ICICI Bank', 'Axis Bank', 'Kotak Mahindra Bank',
  'Punjab National Bank', 'Bank of Baroda', 'Canara Bank', 'Union Bank of India',
  'IDFC FIRST Bank', 'IndusInd Bank', 'Yes Bank', 'Bank of India', 'Indian Bank',
  'Central Bank of India',
];

const departments = [
  'Engineering', 'Human Resources', 'Finance', 'Marketing', 'Sales', 'Operations',
  'IT', 'Customer Support', 'Product', 'Design', 'Legal', 'Administration',
  'Research & Development', 'Procurement',
];

const designations = [
  ['Engineering', 'Software Engineer'], ['Engineering', 'Senior Software Engineer'],
  ['Engineering', 'Tech Lead'], ['Engineering', 'Engineering Manager'],
  ['Human Resources', 'HR Specialist'], ['Human Resources', 'People Operations Lead'],
  ['Human Resources', 'HR Manager'], ['Human Resources', 'Recruiter'],
  ['Finance', 'Accountant'], ['Finance', 'Finance Manager'],
  ['Sales', 'Sales Executive'], ['Sales', 'Sales Manager'],
  ['Marketing', 'Marketing Executive'], ['Product', 'Product Manager'],
  ['Operations', 'Operations Manager'], ['Customer Support', 'Support Executive'],
  ['Administration', 'Office Administrator'], ['Engineering', 'Intern'],
  ['Administration', 'Director'],
];

module.exports = {
  async up(queryInterface) {
    const departmentIds = new Map();
    for (const name of departments) {
      let id = await queryInterface.rawSelect('master_departments', { where: { name } }, ['id']);
      if (!id) {
        await queryInterface.bulkInsert('master_departments', [{ name, description: null, status: 'active', createdAt: new Date(), updatedAt: new Date() }]);
        id = await queryInterface.rawSelect('master_departments', { where: { name } }, ['id']);
      }
      departmentIds.set(name, id);
    }

    for (const [departmentName, name] of designations) {
      const department_id = departmentIds.get(departmentName);
      const existing = await queryInterface.rawSelect('master_designations', { where: { name, department_id } }, ['id']);
      if (!existing) {
        await queryInterface.bulkInsert('master_designations', [{ department_id, name, description: null, status: 'active', createdAt: new Date(), updatedAt: new Date() }]);
      }
    }

    for (const name of banks) {
      const existing = await queryInterface.rawSelect('master_banks', { where: { name } }, ['id']);
      if (!existing) {
        await queryInterface.bulkInsert('master_banks', [{ name, status: 'active', createdAt: new Date(), updatedAt: new Date() }]);
      }
    }
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('master_designations', { name: designations.map(([, name]) => name) });
    await queryInterface.bulkDelete('master_departments', { name: departments });
    await queryInterface.bulkDelete('master_banks', { name: banks });
  },
};
