const router = require('express').Router()
const { upload } = require('../middlewares/multer')
const auth = require('../middlewares/employeeAuthMiddleware')
const attendance = require('../controllers/attendanceController')
router.get('/', auth, attendance.myAttendance)
router.get('/:id', auth, attendance.employeeAttendanceView)
router.post('/punch-in', auth, upload.single('attendance_photo'), attendance.punchIn)
router.post('/punch-out', auth, upload.single('attendance_photo'), attendance.punchOut)
module.exports = router
