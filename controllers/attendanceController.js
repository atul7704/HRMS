const fs = require('fs')
const path = require('path')
const { Op } = require('sequelize')
const { Attendance, AttendanceEvent, Employee } = require('../models')

const zone = 'Asia/Kolkata'
function localParts(date = new Date()) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).formatToParts(date).map(({ type, value }) => [type, value]))
  return { date: `${parts.year}-${parts.month}-${parts.day}`, time: `${parts.hour}:${parts.minute}:${parts.second}` }
}
function removeUploaded(file) { if (file?.path) fs.promises.unlink(path.resolve(file.path)).catch(() => {}) }
function hoursBetween(start, end) {
  const [sh, sm, ss] = start.split(':').map(Number)
  const [eh, em, es] = end.split(':').map(Number)
  return Math.max(0, Number((((eh * 3600 + em * 60 + es) - (sh * 3600 + sm * 60 + ss)) / 3600).toFixed(2)))
}
function fail(res, status, message) { return res.status(status).json({ success: false, message }) }

exports.punchIn = async (req, res) => {
  const file = req.file
  if (!file) return fail(res, 400, 'A live attendance photo is required.')
  try {
    const { date, time } = localParts()
    const row = await Attendance.sequelize.transaction(async (transaction) => {
      const record = await Attendance.create({ employee_id: req.user.id, company_id: req.user.company_id, date, check_in: time, check_in_photo: `/${file.path.replace(/\\/g, '/')}`, status: 'present' }, { transaction })
      await AttendanceEvent.create({ attendance_id: record.id, employee_id: req.user.id, company_id: req.user.company_id, event_type: 'punch_in', event_time: time, photo: `/${file.path.replace(/\\/g, '/')}` }, { transaction })
      return record
    })
    return res.status(201).json({ success: true, message: 'Punch-in recorded.', data: row })
  } catch (error) {
    removeUploaded(file)
    if (error.name === 'SequelizeUniqueConstraintError') return fail(res, 409, 'You have already punched in today.')
    console.error('Attendance punch-in error:', error)
    return fail(res, 500, 'Unable to record punch-in.')
  }
}

exports.punchOut = async (req, res) => {
  const file = req.file
  if (!file) return fail(res, 400, 'A live attendance photo is required.')
  try {
    const { date, time } = localParts()
    let row
    const result = await Attendance.sequelize.transaction(async (transaction) => {
      row = await Attendance.findOne({ where: { employee_id: req.user.id, date }, transaction, lock: transaction.LOCK.UPDATE })
      if (!row) return 'missing'
      const photo = `/${file.path.replace(/\\/g, '/')}`
      await row.update({ check_out: time, check_out_photo: photo, working_hours: hoursBetween(row.check_in, time) }, { transaction })
      await AttendanceEvent.create({ attendance_id: row.id, employee_id: req.user.id, company_id: req.user.company_id, event_type: 'punch_out', event_time: time, photo }, { transaction })
      return 'ok'
    })
    if (result === 'missing') { removeUploaded(file); return fail(res, 409, 'Punch in before punching out.') }
    return res.json({ success: true, message: 'Punch-out recorded.', data: row })
  } catch (error) {
    removeUploaded(file)
    console.error('Attendance punch-out error:', error)
    return fail(res, 500, 'Unable to record punch-out.')
  }
}

exports.myAttendance = async (req, res) => {
  const month = Number(req.query.month), year = Number(req.query.year)
  if (!Number.isInteger(month) || month < 1 || month > 12 || !Number.isInteger(year) || year < 2000 || year > 2200) return fail(res, 400, 'Valid month and year are required.')
  const start = `${year}-${String(month).padStart(2, '0')}-01`
  const end = new Date(year, month, 0).getDate()
  try {
    const rows = await Attendance.findAll({ where: { employee_id: req.user.id, date: { [Op.between]: [start, `${year}-${String(month).padStart(2, '0')}-${String(end).padStart(2, '0')}`] } }, include: [{ model: AttendanceEvent, as: 'events', order: [['event_time', 'ASC']] }], order: [['date', 'DESC']] })
    const today = localParts().date
    const todayRow = await Attendance.findOne({ where: { employee_id: req.user.id, date: today } })
    return res.json({ success: true, data: { records: rows, today: todayRow } })
  } catch (error) { console.error('Employee attendance error:', error); return fail(res, 500, 'Unable to load attendance.') }
}

exports.companyAttendance = async (req, res) => {
  const month = Number(req.query.month), year = Number(req.query.year)
  if (!Number.isInteger(month) || month < 1 || month > 12 || !Number.isInteger(year) || year < 2000 || year > 2200) return fail(res, 400, 'Valid month and year are required.')
  const start = `${year}-${String(month).padStart(2, '0')}-01`, end = new Date(year, month, 0).getDate()
  try {
    const rows = await Attendance.findAll({ where: { company_id: req.user.id, date: { [Op.between]: [start, `${year}-${String(month).padStart(2, '0')}-${String(end).padStart(2, '0')}`] } }, include: [{ model: Employee, as: 'employee', attributes: ['id', 'employee_id', 'name', 'department', 'designation'] }, { model: AttendanceEvent, as: 'events', order: [['event_time', 'ASC']] }], order: [['date', 'DESC'], ['check_in', 'ASC']] })
    return res.json({ success: true, data: rows })
  } catch (error) { console.error('Company attendance error:', error); return fail(res, 500, 'Unable to load company attendance.') }
}

exports.companyEmployeeList = async (req, res) => {
  try {
    const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1)
    const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 10, 1), 100)
    const where = { company_id: req.user.id }
    const search = String(req.query.search || '').trim()
    if (req.query.status && ['active', 'inactive'].includes(req.query.status)) where.status = req.query.status
    if (search) where[Op.or] = ['name', 'employee_id', 'email', 'department', 'designation'].map((field) => ({ [field]: { [Op.like]: `%${search}%` } }))
    const { count, rows } = await Employee.findAndCountAll({
      where,
      attributes: ['id', 'employee_id', 'name', 'email', 'department', 'designation', 'status'],
      limit,
      offset: (page - 1) * limit,
      order: [['name', 'ASC']],
    })
    return res.json({ success: true, data: { employees: rows, pagination: { total: count, page, limit, totalPages: Math.ceil(count / limit) } } })
  } catch (error) {
    console.error('Company attendance employee list error:', error)
    return fail(res, 500, 'Unable to load employees.')
  }
}

exports.companyEmployeeMonthlyAttendance = async (req, res) => {
  const employeeId = Number(req.params.employeeId)
  const month = Number(req.query.month)
  const year = Number(req.query.year)
  const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1)
  const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 10, 1), 100)
  if (!Number.isSafeInteger(employeeId) || employeeId < 1 || !Number.isInteger(month) || month < 1 || month > 12 || !Number.isInteger(year) || year < 2000 || year > 2200) {
    return fail(res, 400, 'A valid employee, month and year are required.')
  }
  try {
    const employee = await Employee.findOne({
      where: { id: employeeId, company_id: req.user.id },
      attributes: ['id', 'employee_id', 'name', 'email', 'department', 'designation', 'status'],
    })
    if (!employee) return fail(res, 404, 'Employee not found.')
    const from = `${year}-${String(month).padStart(2, '0')}-01`
    const lastDay = new Date(year, month, 0).getDate()
    const to = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
    const attendanceWhere = { employee_id: employeeId, company_id: req.user.id, date: { [Op.between]: [from, to] } }
    if (req.query.status && ['present', 'absent', 'half_day', 'leave', 'holiday', 'week_off'].includes(req.query.status)) attendanceWhere.status = req.query.status
    const { count, rows: records } = await Attendance.findAndCountAll({
      where: attendanceWhere,
      include: [{ model: AttendanceEvent, as: 'events' }],
      order: [['date', 'DESC']],
      limit,
      offset: (page - 1) * limit,
    })
    return res.json({ success: true, data: { employee, records, pagination: { total: count, page, limit, totalPages: Math.ceil(count / limit) } } })
  } catch (error) {
    console.error('Company employee attendance detail error:', error)
    return fail(res, 500, 'Unable to load employee attendance.')
  }
}

exports.employeeAttendanceView = async (req, res) => {
  const row = await Attendance.findOne({ where: { id: req.params.id, employee_id: req.user.id }, include: [{ model: AttendanceEvent, as: 'events', order: [['event_time', 'ASC']] }] })
  if (!row) return fail(res, 404, 'Attendance record not found.')
  return res.json({ success: true, data: row })
}

exports.companyAttendanceView = async (req, res) => {
  const row = await Attendance.findOne({ where: { id: req.params.id, company_id: req.user.id }, include: [{ model: Employee, as: 'employee', attributes: ['id', 'employee_id', 'name', 'department', 'designation'] }, { model: AttendanceEvent, as: 'events', order: [['event_time', 'ASC']] }] })
  if (!row) return fail(res, 404, 'Attendance record not found.')
  return res.json({ success: true, data: row })
}
