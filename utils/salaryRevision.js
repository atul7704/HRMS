const { Op } = require('sequelize')
const { SalaryRevision } = require('../models')

const numericFields = [
  'basic',
  'hra',
  'pf_basic',
  'conveyance',
  'medical_allowance',
  'eps_basic',
  'special_allowance',
  'fixed_bonus',
  'bonus_rate',
]

function isValidDateOnly(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T00:00:00.000Z`)
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
}

function payrollPeriodEnd(monthValue, yearValue) {
  const month = Number(monthValue)
  const year = Number(yearValue)
  if (!Number.isInteger(month) || month < 1 || month > 12 || !Number.isInteger(year) || year < 1900 || year > 2200) return null
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate()
  return `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
}

function normalizeSalaryStructure(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return { error: 'A salary structure is required.' }
  }

  const salary = {}
  for (const field of numericFields) {
    const value = input[field] === '' || input[field] === null || input[field] === undefined ? 0 : Number(input[field])
    if (!Number.isFinite(value) || value < 0) return { error: `${field} must be a non-negative number.` }
    salary[field] = Math.round(value * 100) / 100
  }

  if (!['yes', 'no'].includes(input.esic_applicable)) {
    return { error: 'esic_applicable must be yes or no.' }
  }

  salary.esic_applicable = input.esic_applicable
  salary.total = Math.round((salary.basic + salary.hra + salary.conveyance + salary.medical_allowance + salary.special_allowance + salary.fixed_bonus) * 100) / 100
  return { salary }
}

function plainSalary(salary) {
  return salary?.get ? salary.get({ plain: true }) : salary || null
}

async function resolveEffectiveSalary(employeeId, baseSalary, asOfDate, transaction) {
  const revision = await SalaryRevision.findOne({
    where: {
      employee_id: employeeId,
      effective_from: { [Op.lte]: asOfDate },
      salary_structure: { [Op.ne]: null },
    },
    order: [['effective_from', 'DESC'], ['id', 'DESC']],
    transaction,
  })

  const base = plainSalary(baseSalary)
  if (!revision) return { salary: base, revision: null }

  let revisionSalary = revision.salary_structure
  if (typeof revisionSalary === 'string') {
    try { revisionSalary = JSON.parse(revisionSalary) } catch { revisionSalary = null }
  }

  if (!revisionSalary || typeof revisionSalary !== 'object' || Array.isArray(revisionSalary)) {
    return { salary: base, revision: null }
  }

  return {
    salary: { ...(base || {}), ...revisionSalary },
    revision,
  }
}

module.exports = {
  isValidDateOnly,
  normalizeSalaryStructure,
  payrollPeriodEnd,
  resolveEffectiveSalary,
}
