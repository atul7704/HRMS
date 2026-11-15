const { Employee, Company } = require('../models');

const SKIP_WORDS = [
  'pvt', 'ltd', 'limited', 'private', 'inc', 'llc',
  'corp', 'corporation', 'llp', 'co',
];

async function generateEmployeeId(company_id) {
  const company = await Company.findByPk(company_id);
  if (!company) {
    throw new Error('Company not found');
  }

  const initials = company.company_name
    .replace(/[^a-zA-Z\s]/g, '')
    .split(/\s+/)
    .filter((word) => word.length > 0 && !SKIP_WORDS.includes(word.toLowerCase()))
    .map((word) => word[0].toUpperCase())
    .join('');

  const lastEmployee = await Employee.findOne({
    where: { company_id },
    order: [['id', 'DESC']],
    attributes: ['employee_id'],
  });

  let nextNumber = 1;

  if (lastEmployee && lastEmployee.employee_id) {
    const lastNumber = parseInt(lastEmployee.employee_id.replace(initials, ''), 10);
    if (!isNaN(lastNumber)) {
      nextNumber = lastNumber + 1;
    }
  }

  return `${initials}${String(nextNumber).padStart(5, '0')}`;
}

module.exports = generateEmployeeId;