const router = require('express').Router()
const auth = require('../middlewares/companyAuthMiddleware')
const attendance = require('../controllers/attendanceController')
router.get('/', auth, attendance.companyAttendance)
router.get('/employees', auth, attendance.companyEmployeeList)
router.get('/employee/:employeeId', auth, attendance.companyEmployeeMonthlyAttendance)
router.get('/:id', auth, attendance.companyAttendanceView)
module.exports = router
