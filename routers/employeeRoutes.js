const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');
const employeeAuthMiddleware = require('../middlewares/employeeAuthMiddleware');
const { upload } = require('../middlewares/multer');

router.post('/login', employeeController.login);
router.post('/forget-password', employeeController.forgetPassword);
router.post('/verify-reset-otp', employeeController.verifyResetOtp);
router.post('/reset-password', employeeController.resetPassword);

router.post('/verify-password', employeeAuthMiddleware, employeeController.verifyPassword);
router.get('/profile', employeeAuthMiddleware, employeeController.getMyProfile);
router.patch('/profile', employeeAuthMiddleware, upload.single('profile_pic'), employeeController.updateMyProfile);
router.get('/salary-slips', employeeAuthMiddleware, employeeController.getMySalarySlips);
router.get('/salary-slips/:id', employeeAuthMiddleware, employeeController.getMySalarySlip);
router.get('/salary-slips/:id/download', employeeAuthMiddleware, employeeController.downloadMySalarySlip);

module.exports = router;
