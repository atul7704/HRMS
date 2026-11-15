const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { randomInt } = require('crypto');
const sendSalarySlipPdf = require('../utils/salarySlipPdf');
const { Op } = require('sequelize');
const { Employee, Company, EmployeeKyc, EmployeeSalary, EmployeeAddress, EmployeeNominee, EmployeeFamily, Payroll, SalaryRevision } = require('../models');
const sendEmail = require('../utils/sendEmail');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const OTP_REGEX = /^\d{6}$/;

const safeEmployee = (employee) => {
  const data = employee.toJSON();
  delete data.password;
  delete data.reset_otp;
  delete data.reset_otp_expiry;
  return data;
};

exports.login = async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password are required.' });
    if (!EMAIL_REGEX.test(email)) return res.status(400).json({ success: false, message: 'Enter a valid email address.' });

    const employee = await Employee.findOne({ where: { email } });
    if (!employee || !(await bcrypt.compare(password, employee.password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }
    if (employee.status !== 'active') return res.status(403).json({ success: false, message: 'Your account is inactive. Contact your company administrator.' });

    const token = jwt.sign(
      { id: employee.id, company_id: employee.company_id, employee_id: employee.employee_id, email: employee.email, role: { name: 'Employee', slug: 'employee' } },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' },
    );
    employee.last_login = new Date();
    await employee.save();

    return res.status(200).json({ success: true, message: 'Signed in successfully.', data: { token, employee: safeEmployee(employee) } });
  } catch (error) {
    console.error('Employee login error:', error);
    return res.status(500).json({ success: false, message: 'Unable to sign in.' });
  }
};

exports.forgetPassword = async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    if (!email || !EMAIL_REGEX.test(email)) return res.status(400).json({ success: false, message: 'A valid email address is required.' });
    const employee = await Employee.findOne({ where: { email, status: 'active' } });
    if (!employee) return res.status(404).json({ success: false, message: 'No active employee account exists for this email.' });

    const otp = String(randomInt(100000, 1000000));
    employee.reset_otp = otp;
    employee.reset_otp_expiry = new Date(Date.now() + 10 * 60 * 1000);
    await employee.save();
    try {
      await sendEmail({ email, subject: 'Employee password reset OTP', message: `Your employee password reset OTP is ${otp}. It is valid for 10 minutes.` });
    } catch (emailError) {
      employee.reset_otp = null;
      employee.reset_otp_expiry = null;
      await employee.save();
      throw emailError;
    }
    return res.status(200).json({ success: true, message: 'OTP sent to your email successfully.' });
  } catch (error) {
    console.error('Employee forgot password error:', error);
    return res.status(500).json({ success: false, message: 'Unable to send password reset OTP.' });
  }
};

exports.verifyResetOtp = async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const otp = String(req.body.otp || '').trim();
    if (!email || !OTP_REGEX.test(otp)) return res.status(400).json({ success: false, message: 'A valid email and six-digit OTP are required.' });
    const employee = await Employee.findOne({ where: { email, status: 'active', reset_otp: otp, reset_otp_expiry: { [Op.gt]: new Date() } }, attributes: ['id', 'email'] });
    if (!employee) return res.status(400).json({ success: false, message: 'Invalid or expired OTP.' });
    return res.status(200).json({ success: true, message: 'OTP verified successfully.', data: { email: employee.email } });
  } catch (error) {
    console.error('Employee OTP verification error:', error);
    return res.status(500).json({ success: false, message: 'Unable to verify OTP.' });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const otp = String(req.body.otp || '').trim();
    const newPassword = String(req.body.new_password || '');
    if (!email || !OTP_REGEX.test(otp) || !newPassword) return res.status(400).json({ success: false, message: 'Email, six-digit OTP, and new password are required.' });
    if (newPassword.length < 8) return res.status(400).json({ success: false, message: 'Password must contain at least 8 characters.' });
    const employee = await Employee.findOne({ where: { email, status: 'active', reset_otp: otp, reset_otp_expiry: { [Op.gt]: new Date() } } });
    if (!employee) return res.status(400).json({ success: false, message: 'Invalid or expired OTP.' });

    employee.password = await bcrypt.hash(newPassword, 10);
    employee.reset_otp = null;
    employee.reset_otp_expiry = null;
    await employee.save();
    return res.status(200).json({ success: true, message: 'Password reset successfully. You can sign in now.' });
  } catch (error) {
    console.error('Employee password reset error:', error);
    return res.status(500).json({ success: false, message: 'Unable to reset password.' });
  }
};

exports.verifyPassword = async (req, res) => {
  try {
    const password = String(req.body.password || '');
    if (!password) return res.status(400).json({ success: false, message: 'Password is required.' });
    const employee = await Employee.findByPk(req.user.id, { attributes: ['id', 'password'] });
    if (!employee) return res.status(404).json({ success: false, message: 'Employee account not found.' });
    const isValid = await bcrypt.compare(password, employee.password);
    if (!isValid) return res.status(400).json({ success: false, message: 'Password is incorrect.', data: { verified: false } });
    return res.status(200).json({ success: true, message: 'Password verified.', data: { verified: true } });
  } catch (error) {
    console.error('Employee password verification error:', error);
    return res.status(500).json({ success: false, message: 'Unable to verify password.' });
  }
};

exports.getMyProfile = async (req, res) => {
  try {
    const employee = await Employee.findByPk(req.user.id, {
      attributes: { exclude: ['password', 'reset_otp', 'reset_otp_expiry'] },
      include: [
        { model: Company, as: 'company', attributes: ['id', 'company_name', 'email', 'logo'] },
        { model: EmployeeKyc, as: 'kyc' },
        { model: EmployeeSalary, as: 'salary' },
        { model: EmployeeAddress, as: 'addresses' },
        { model: EmployeeNominee, as: 'nominees' },
        { model: EmployeeFamily, as: 'families' },
      ],
    });
    if (!employee) return res.status(404).json({ success: false, message: 'Employee profile not found.' });
    return res.status(200).json({ success: true, message: 'Profile fetched successfully.', data: employee });
  } catch (error) {
    console.error('Get employee profile error:', error);
    return res.status(500).json({ success: false, message: 'Unable to load employee profile.' });
  }
};

exports.updateMyProfile = async (req, res) => {
  try {
    const employee = await Employee.findByPk(req.user.id);
    if (!employee) return res.status(404).json({ success: false, message: 'Employee profile not found.' });
    if (req.body.phone !== undefined) employee.phone = String(req.body.phone).trim();
    if (req.file) employee.profile_image = `/${req.file.path.replace(/\\/g, '/')}`;
    await employee.save();
    return res.status(200).json({ success: true, message: 'Profile updated successfully.', data: safeEmployee(employee) });
  } catch (error) {
    console.error('Update employee profile error:', error);
    return res.status(500).json({ success: false, message: 'Unable to update employee profile.' });
  }
};

exports.getMySalarySlips = async (req, res) => {
  try {
    const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 20, 1), 100);
    const where = { employee_id: req.user.id, status: { [Op.in]: ['processed', 'paid'] } };
    if (req.query.month) where.month = Number(req.query.month);
    if (req.query.year) where.year = Number(req.query.year);
    const { count, rows } = await Payroll.findAndCountAll({
      where,
      attributes: ['id', 'month', 'year', 'salary_revision_id', 'working_days', 'present_days', 'leave_days', 'absent_days', 'basic', 'hra', 'conveyance', 'medical_allowance', 'special_allowance', 'bonus', 'overtime_amount', 'gross_salary', 'pf_deduction', 'esi_deduction', 'tax_deduction', 'other_deduction', 'total_deduction', 'net_salary', 'status', 'paid_at', 'createdAt'],
      order: [['year', 'DESC'], ['month', 'DESC'], ['id', 'DESC']],
      limit,
      offset: (page - 1) * limit,
    });
    return res.status(200).json({ success: true, message: 'Salary slips fetched successfully.', data: { slips: rows, pagination: { total: count, page, limit, totalPages: Math.ceil(count / limit) } } });
  } catch (error) {
    console.error('Employee salary slip listing error:', error);
    return res.status(500).json({ success: false, message: 'Unable to load salary slips.' });
  }
};

exports.getMySalarySlip = async (req, res) => {
  try {
    const payroll = await Payroll.findOne({
      where: { id: req.params.id, employee_id: req.user.id, status: { [Op.in]: ['processed', 'paid'] } },
      include: [
        { model: Employee, as: 'employee', attributes: ['id', 'employee_id', 'name', 'email', 'designation', 'department', 'date_of_joining', 'phone', 'profile_image'], include: [{ model: EmployeeKyc, as: 'kyc', attributes: ['uan_pf', 'bank_account', 'bank_name', 'ifsc', 'pan'] }] },
        { model: Company, as: 'company', attributes: ['id', 'company_name', 'email', 'logo', 'website', 'address', 'cin_number'] },
        { model: SalaryRevision, as: 'salary_revision', attributes: ['id', 'effective_from', 'old_salary', 'new_salary'] },
      ],
    });
    if (!payroll) return res.status(404).json({ success: false, message: 'Salary slip not found.' });
    return res.status(200).json({ success: true, message: 'Salary slip fetched successfully.', data: payroll });
  } catch (error) {
    console.error('Employee salary slip detail error:', error);
    return res.status(500).json({ success: false, message: 'Unable to load salary slip.' });
  }
};

exports.downloadMySalarySlip = async (req, res) => {
  const payrollId = Number(req.params.id);
  if (!Number.isSafeInteger(payrollId) || payrollId < 1) {
    return res.status(404).json({ success: false, message: 'Salary slip not found.' });
  }

  try {
    const payroll = await Payroll.findOne({
      where: {
        id: payrollId,
        employee_id: req.user.id,
        status: { [Op.in]: ['processed', 'paid'] },
      },
      include: [
        {
          model: Employee,
          as: 'employee',
          attributes: ['id', 'employee_id', 'name', 'designation', 'department', 'location', 'date_of_joining'],
          include: [{
            model: EmployeeKyc,
            as: 'kyc',
            attributes: ['uan_pf', 'bank_account', 'bank_name', 'ifsc', 'pan'],
          }],
        },
        {
          model: Company,
          as: 'company',
          attributes: ['id', 'company_name', 'email', 'logo', 'cin_number', 'website', 'address', 'city', 'state', 'country', 'pincode', 'industry_type'],
        },
        { model: SalaryRevision, as: 'salary_revision', attributes: ['id', 'effective_from', 'old_salary', 'new_salary'] },
      ],
    });

    if (!payroll) return res.status(404).json({ success: false, message: 'Salary slip not found.' });
    return sendSalarySlipPdf(res, payroll);
  } catch (error) {
    console.error('Employee salary slip download error:', error);
    if (res.headersSent) return res.destroy(error);
    return res.status(500).json({ success: false, message: 'Unable to generate the salary slip.' });
  }
};
