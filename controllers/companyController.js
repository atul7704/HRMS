const express=require('express');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { randomInt } = require('crypto');
const sendSalarySlipPdf = require('../utils/salarySlipPdf');
const sendEmail = require('../utils/sendEmail');
const { Admin, Role,Company, Employee,
  EmployeeKyc,
  EmployeeSalary,
  EmployeeAddress,
  EmployeeNominee,
  EmployeeFamily,
  Payroll,
  Attendance,
  Leave,
  LeaveBalance,
  SalaryRevision,
  Document,
   } = require('../models');
const { isValidDateOnly, normalizeSalaryStructure, payrollPeriodEnd, resolveEffectiveSalary } = require('../utils/salaryRevision');
const generateEmployeeId = require('../utils/generateEmployeeId');
const generatePassword = require('../utils/generatePassword');
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i;

exports.forgetCompanyPassword = async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    if (!email || !EMAIL_REGEX.test(email)) {
      return res.status(400).json({ success: false, message: 'A valid email address is required.' });
    }

    const company = await Company.findOne({ where: { email } });
    if (!company) {
      return res.status(404).json({ success: false, message: 'Company with this email does not exist.' });
    }

    const otp = String(randomInt(100000, 1000000));
    company.reset_otp = otp;
    company.reset_otp_expiry = new Date(Date.now() + 10 * 60 * 1000);
    await company.save();

    try {
      await sendEmail({ email, subject: 'Company password reset OTP', message: `Your company password reset OTP is ${otp}. It is valid for 10 minutes.` });
    } catch (emailError) {
      company.reset_otp = null;
      company.reset_otp_expiry = null;
      await company.save();
      throw emailError;
    }

    return res.status(200).json({ success: true, message: 'OTP sent to your company email successfully.' });
  } catch (error) {
    console.error('Company forgot password error:', error);
    return res.status(500).json({ success: false, message: 'Unable to send password reset OTP.' });
  }
};

exports.verifyCompanyResetOtp = async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const otp = String(req.body.otp || '').trim();
    if (!email || !/^\d{6}$/.test(otp)) {
      return res.status(400).json({ success: false, message: 'A valid email and six-digit OTP are required.' });
    }

    const company = await Company.findOne({ where: { email, reset_otp: otp, reset_otp_expiry: { [Op.gt]: new Date() } }, attributes: ['id', 'email'] });
    if (!company) return res.status(400).json({ success: false, message: 'Invalid or expired OTP.' });

    return res.status(200).json({ success: true, message: 'OTP verified successfully.', data: { email: company.email } });
  } catch (error) {
    console.error('Company verify reset OTP error:', error);
    return res.status(500).json({ success: false, message: 'Unable to verify OTP.' });
  }
};

exports.resetCompanyPassword = async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const otp = String(req.body.otp || '').trim();
    const newPassword = String(req.body.new_password || '');
    if (!email || !/^\d{6}$/.test(otp) || !newPassword) {
      return res.status(400).json({ success: false, message: 'Email, six-digit OTP, and new password are required.' });
    }
    if (newPassword.length < 8) return res.status(400).json({ success: false, message: 'Password must contain at least 8 characters.' });

    const company = await Company.findOne({ where: { email, reset_otp: otp, reset_otp_expiry: { [Op.gt]: new Date() } } });
    if (!company) return res.status(400).json({ success: false, message: 'Invalid or expired OTP.' });

    company.password = await bcrypt.hash(newPassword, 10);
    company.reset_otp = null;
    company.reset_otp_expiry = null;
    await company.save();
    return res.status(200).json({ success: true, message: 'Password reset successfully. You can sign in now.' });
  } catch (error) {
    console.error('Company reset password error:', error);
    return res.status(500).json({ success: false, message: 'Unable to reset password.' });
  }
};

const parseJsonField = (value, fallback) => {
  if (value === undefined || value === null) return fallback;
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

exports.companyLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format',
      });
    }

    const company = await Company.findOne({ where: { email } });
    if (!company) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    if (company.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Account is inactive. Contact support.',
      });
    }

    const isMatch = await bcrypt.compare(password, company.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    const role = await Role.findOne({ where: { slug: 'company' } });
    if (!role) {
      return res.status(500).json({
        success: false,
        message: 'Role configuration missing',
      });
    }

    const token = jwt.sign(
      {
        id: company.id,
        company_name: company.company_name,
        email: company.email,
        phone: company.phone,
        logo: company.logo,
        role: {
          id: role.id,
          name: role.name,
          slug: role.slug,
        },
        status: company.status,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    company.last_login = new Date();
    await company.save();

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        company: {
          id: company.id,
          company_name: company.company_name,
          email: company.email,
          phone: company.phone,
          logo: company.logo,
          cin_number: company.cin_number,
          gst_number: company.gst_number,
          status: company.status,
          last_login: company.last_login,
          role: {
            id: role.id,
            name: role.name,
            slug: role.slug,
          },
        },
      },
    });
  } catch (err) {
    console.error('Company login error:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: err.message,
    });
  }
};


exports.createEmployee = async (req, res) => {
  const transaction = await Employee.sequelize.transaction();

  try {
    if (!req.user || !req.user.role || req.user.role.slug !== 'company') {
      await transaction.rollback();
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only company can create employees.',
      });
    }

    const requestBody = {
      ...req.body,
      kyc: parseJsonField(req.body.kyc, {}),
      salary: parseJsonField(req.body.salary, {}),
      addresses: parseJsonField(req.body.addresses, []),
      nominees: parseJsonField(req.body.nominees, []),
      families: parseJsonField(req.body.families, []),
    };

    const {
      name,
      email,
      phone,
      gender,
      dob,
      father_name,
      relation,
      marital_status,
      designation,
      department,
      location,
      client_id,
      date_of_joining,
      status,
      kyc,
      salary,
      addresses,
      nominees,
      families,
    } = requestBody;

    const company_id = req.user.id;

    
    const profile_image = req.file
      ? `/${req.file.path.replace(/\\/g, '/')}`
      : null;

    if (!name || !email) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Name and email are required',
      });
    }

    if (!EMAIL_REGEX.test(email)) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Invalid email format',
      });
    }

    if (!kyc || !kyc.pan) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'PAN number is required to generate password',
      });
    }

    if (!PAN_REGEX.test(kyc.pan)) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Invalid PAN format (e.g., ABCDE1234F)',
      });
    }

    if (!dob) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Date of birth is required to generate password',
      });
    }

    const existingEmployee = await Employee.findOne({
      where: { email },
      attributes: ['id'],
    });

    if (existingEmployee) {
      await transaction.rollback();
      return res.status(409).json({
        success: false,
        message: 'Employee with this email already exists',
      });
    }

    const company = await Company.findByPk(company_id, {
      attributes: ['id', 'company_name'],
    });

    if (!company) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Company not found',
      });
    }

    const employee_id = await generateEmployeeId(company_id);
    const plainPassword = generatePassword(kyc.pan, dob);
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    const employee = await Employee.create(
      {
        employee_id,
        company_id,
        name,
        email,
        password: hashedPassword,
        phone,
        profile_image, 
        gender,
        dob,
        father_name,
        relation,
        marital_status,
        designation,
        department,
        location,
        client_id,
        date_of_joining,
        status: status || 'active',
      },
      { transaction }
    );

    if (kyc) {
      await EmployeeKyc.create(
        {
          employee_id: employee.id,
          uan_pf: kyc.uan_pf,
          esi: kyc.esi,
          bank_account: kyc.bank_account,
          bank_name: kyc.bank_name,
          ifsc: kyc.ifsc,
          pan: kyc.pan,
          aadhar_number: kyc.aadhar_number,
        },
        { transaction }
      );
    }

    if (salary) {
      const basic = parseFloat(salary.basic) || 0;
      const hra = parseFloat(salary.hra) || 0;
      const pf_basic = parseFloat(salary.pf_basic) || 0;
      const conveyance = parseFloat(salary.conveyance) || 0;
      const medical_allowance = parseFloat(salary.medical_allowance) || 0;
      const eps_basic = parseFloat(salary.eps_basic) || 0;
      const special_allowance = parseFloat(salary.special_allowance) || 0;
      const fixed_bonus = parseFloat(salary.fixed_bonus) || 0;

      const total =
        basic + hra + conveyance + medical_allowance + special_allowance + fixed_bonus;

      await EmployeeSalary.create(
        {
          employee_id: employee.id,
          basic,
          hra,
          pf_basic,
          conveyance,
          medical_allowance,
          eps_basic,
          special_allowance,
          fixed_bonus,
          esic_applicable: salary.esic_applicable || 'no',
          total,
          bonus_rate: salary.bonus_rate || 0,
        },
        { transaction }
      );
    }

    if (Array.isArray(addresses) && addresses.length > 0) {
      await EmployeeAddress.bulkCreate(
        addresses.map((a) => ({
          employee_id: employee.id,
          address_type: a.address_type || 'present',
          address: a.address,
          district: a.district,
          state: a.state,
          pin: a.pin,
          country: a.country || 'India',
        })),
        { transaction }
      );
    }

    if (Array.isArray(nominees) && nominees.length > 0) {
      await EmployeeNominee.bulkCreate(
        nominees.map((n) => ({
          employee_id: employee.id,
          name: n.name,
          address: n.address,
          dob: n.dob,
          relation: n.relation,
        })),
        { transaction }
      );
    }

    if (Array.isArray(families) && families.length > 0) {
      await EmployeeFamily.bulkCreate(
        families.map((f) => ({
          employee_id: employee.id,
          name: f.name,
          relation: f.relation,
          dob: f.dob,
          address: f.address,
          aadhar: f.aadhar,
        })),
        { transaction }
      );
    }

    await transaction.commit();

    return res.status(201).json({
      success: true,
      message: 'Employee created successfully',
      data: {
        id: employee.id,
        employee_id: employee.employee_id,
        name: employee.name,
        email: employee.email,
        profile_image: employee.profile_image, 
        password: plainPassword,
      },
    });
  } catch (err) {
    await transaction.rollback();
    console.error('Create employee error:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: err.message,
    });
  }
};


exports.getEmployees = async (req, res) => {
  try {
    if (!req.user || !req.user.role || req.user.role.slug !== 'company') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only company can view employees.',
      });
    }

    const company_id = req.user.id;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const {
      employee_id,
      company_filter,
      name,
      father_name,
      mobile,
      total_salary,
      status,
    } = req.query;

    const where = { company_id };

    if (status) {
      where.status = status;
    }

    if (employee_id) {
      where.employee_id = { [Op.like]: `%${employee_id}%` };
    }

    if (company_filter) {
      where.company_id = company_filter;
    }

    if (name) {
      where.name = { [Op.like]: `%${name}%` };
    }

    if (father_name) {
      where.father_name = { [Op.like]: `%${father_name}%` };
    }

    if (mobile) {
      where.phone = { [Op.like]: `%${mobile}%` };
    }

    const salaryWhere = {};
    if (total_salary) {
      salaryWhere.total = { [Op.like]: `%${total_salary}%` };
    }

    const { count, rows } = await Employee.findAndCountAll({
      where,
      limit,
      offset,
      order: [['id', 'DESC']],
      attributes: [
        'id',
        'employee_id',
        'company_id',
        'name',
        'email',
        'phone',
        'profile_image',
        'father_name',
        'designation',
        'department',
        'status',
        'date_of_joining',
        'createdAt',
      ],
      include: [
        {
          model: EmployeeSalary,
          as: 'salary',
          attributes: ['basic', 'hra', 'total'],
          where: Object.keys(salaryWhere).length ? salaryWhere : undefined,
          required: Object.keys(salaryWhere).length ? true : false,
        },
        {
          model: SalaryRevision,
          as: 'salary_revisions',
          attributes: ['id', 'effective_from', 'new_salary', 'salary_structure'],
          where: { effective_from: { [Op.lte]: payrollPeriodEnd(new Date().getMonth() + 1, new Date().getFullYear()) } },
          separate: true,
          limit: 1,
          order: [['effective_from', 'DESC'], ['id', 'DESC']],
        },
      ],
      distinct: true,
    });

    return res.status(200).json({
      success: true,
      message: 'Employees fetched successfully',
      data: {
        employees: rows,
        pagination: {
          total: count,
          page,
          limit,
          totalPages: Math.ceil(count / limit),
        },
      },
    });
  } catch (err) {
    console.error('Get employees error:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: err.message,
    });
  }
};



exports.getEmployeeById = async (req, res) => {
  try {
    if (!req.user || !req.user.role || req.user.role.slug !== 'company') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only company can view employee details.',
      });
    }

    const { id } = req.params;
    const company_id = req.user.id;

    const employee = await Employee.findOne({
      where: { id, company_id },
      attributes: { exclude: ['password'] },
      include: [
        {
          model: EmployeeSalary,
          as: 'salary',
        },
        {
          model: EmployeeKyc,
          as: 'kyc',
        },
        {
          model: EmployeeAddress,
          as: 'addresses',
        },
        {
          model: EmployeeNominee,
          as: 'nominees',
        },
        {
          model: EmployeeFamily,
          as: 'families',
        }
      ],
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Employee details fetched successfully',
      data: employee,
    });

  } catch (err) {
    console.error('Get employee by id error:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: err.message,
    });
  }
};

exports.getCompanyEmployeeSalaryForPeriod = async (req, res) => {
  const employeeId = Number(req.params.id);
  const periodEnd = payrollPeriodEnd(req.query.month, req.query.year);
  if (!Number.isSafeInteger(employeeId) || employeeId < 1 || !periodEnd) {
    return res.status(400).json({ success: false, message: 'A valid employee, month, and year are required.' });
  }

  try {
    const employee = await Employee.findOne({
      where: { id: employeeId, company_id: req.user.id },
      attributes: ['id', 'employee_id', 'name'],
      include: [{ model: EmployeeSalary, as: 'salary' }],
    });
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found in your company.' });

    const effective = await resolveEffectiveSalary(employee.id, employee.salary, periodEnd);
    return res.status(200).json({
      success: true,
      message: 'Effective salary fetched successfully.',
      data: {
        employee: { id: employee.id, employee_id: employee.employee_id, name: employee.name },
        salary: effective.salary,
        revision: effective.revision,
        effective_through: periodEnd,
      },
    });
  } catch (error) {
    console.error('Get effective employee salary error:', error);
    return res.status(500).json({ success: false, message: 'Unable to load the employee salary for this period.' });
  }
};

exports.getCompanyEmployeeSalaryRevisions = async (req, res) => {
  const employeeId = Number(req.params.id);
  if (!Number.isSafeInteger(employeeId) || employeeId < 1) {
    return res.status(400).json({ success: false, message: 'A valid employee is required.' });
  }

  try {
    const employee = await Employee.findOne({
      where: { id: employeeId, company_id: req.user.id },
      attributes: ['id', 'employee_id', 'name'],
    });
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found in your company.' });

    const revisions = await SalaryRevision.findAll({
      where: { employee_id: employee.id },
      order: [['effective_from', 'DESC'], ['id', 'DESC']],
    });

    return res.status(200).json({
      success: true,
      message: 'Salary revisions fetched successfully.',
      data: { employee, revisions },
    });
  } catch (error) {
    console.error('Get employee salary revisions error:', error);
    return res.status(500).json({ success: false, message: 'Unable to load salary revision history.' });
  }
};

exports.getCompanySalaryRevisionListing = async (req, res) => {
  const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 50, 1), 100);
  const employeeWhere = { company_id: req.user.id };
  if (req.query.employee_id) {
    const employeeId = Number(req.query.employee_id);
    if (!Number.isSafeInteger(employeeId) || employeeId < 1) {
      return res.status(400).json({ success: false, message: 'A valid employee id is required.' });
    }
    employeeWhere.id = employeeId;
  }
  const search = String(req.query.search || '').trim();
  if (search) {
    employeeWhere[Op.or] = [
      { name: { [Op.like]: `%${search}%` } },
      { employee_id: { [Op.like]: `%${search}%` } },
    ];
  }

  try {
    const { count, rows } = await SalaryRevision.findAndCountAll({
      limit,
      offset: (page - 1) * limit,
      order: [['effective_from', 'DESC'], ['id', 'DESC']],
      include: [{
        model: Employee,
        as: 'employee',
        attributes: ['id', 'employee_id', 'name', 'designation', 'department'],
        where: employeeWhere,
        required: true,
      }],
      distinct: true,
    });
    return res.status(200).json({
      success: true,
      message: 'Company salary revisions fetched successfully.',
      data: { revisions: rows, pagination: { total: count, page, limit, totalPages: Math.ceil(count / limit) } },
    });
  } catch (error) {
    console.error('Company salary revision listing error:', error);
    return res.status(500).json({ success: false, message: 'Unable to load company salary revisions.' });
  }
};

exports.createCompanyEmployeeSalaryRevision = async (req, res) => {
  const employeeId = Number(req.params.id);
  const { effective_from: effectiveFrom, reason } = req.body;
  const { salary, error: salaryError } = normalizeSalaryStructure(req.body.salary);

  if (!Number.isSafeInteger(employeeId) || employeeId < 1) {
    return res.status(400).json({ success: false, message: 'A valid employee is required.' });
  }
  if (!isValidDateOnly(effectiveFrom)) {
    return res.status(400).json({ success: false, message: 'Effective date must be a valid YYYY-MM-DD date.' });
  }
  if (salaryError) return res.status(400).json({ success: false, message: salaryError });
  if (reason !== undefined && String(reason).trim().length > 255) {
    return res.status(400).json({ success: false, message: 'Reason must not exceed 255 characters.' });
  }

  try {
    const employee = await Employee.findOne({
      where: { id: employeeId, company_id: req.user.id },
      attributes: ['id', 'employee_id', 'name'],
      include: [{ model: EmployeeSalary, as: 'salary' }],
    });
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found in your company.' });

    const duplicate = await SalaryRevision.findOne({
      where: { employee_id: employee.id, effective_from: effectiveFrom },
      attributes: ['id'],
    });
    if (duplicate) {
      return res.status(409).json({ success: false, message: 'A salary revision already exists for this effective date.' });
    }

    const previousDate = new Date(`${effectiveFrom}T00:00:00.000Z`);
    previousDate.setUTCDate(previousDate.getUTCDate() - 1);
    const previousEffective = await resolveEffectiveSalary(
      employee.id,
      employee.salary,
      previousDate.toISOString().slice(0, 10),
    );
    const oldSalary = Number(previousEffective.salary?.total) || 0;
    const oldSalaryData = normalizeSalaryStructure({
      ...(previousEffective.salary || {}),
      esic_applicable: previousEffective.salary?.esic_applicable || 'no',
    });

    const revision = await SalaryRevision.create({
      employee_id: employee.id,
      old_salary: oldSalary,
      new_salary: salary.total,
      salary_structure: salary,
      old_salary_structure: oldSalaryData.salary || null,
      effective_from: effectiveFrom,
      reason: reason ? String(reason).trim() : null,
      approved_by: null,
    });

    return res.status(201).json({
      success: true,
      message: 'Salary revision created successfully.',
      data: { revision, employee },
    });
  } catch (error) {
    console.error('Create employee salary revision error:', error);
    return res.status(500).json({ success: false, message: 'Unable to create the salary revision.' });
  }
};

exports.updateEmployee = async (req, res) => {
  const transaction = await Employee.sequelize.transaction();

  try {
    if (!req.user || !req.user.role || req.user.role.slug !== 'company') {
      await transaction.rollback();
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const { id } = req.params;
    const company_id = req.user.id;

    const employee = await Employee.findOne({
      where: { id, company_id },
      transaction,
    });

    if (!employee) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    const requestBody = {
      ...req.body,
      kyc: parseJsonField(req.body.kyc, null),
      salary: parseJsonField(req.body.salary, null),
      addresses: parseJsonField(req.body.addresses, undefined),
      nominees: parseJsonField(req.body.nominees, undefined),
      families: parseJsonField(req.body.families, undefined),
    };

    const {
      name, email, phone, gender, dob, father_name, relation, marital_status,
      designation, department, location, client_id, date_of_joining, status,
      kyc, salary, addresses, nominees, families,
    } = requestBody;

    if (salary) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: 'Use the dated salary revision endpoint to change an employee salary.' });
    }

    const profile_image = req.file
      ? `/${req.file.path.replace(/\\/g, '/')}`
      : employee.profile_image;

    if (email && email !== employee.email) {
      const existingEmail = await Employee.findOne({ where: { email }, transaction });
      if (existingEmail) {
        await transaction.rollback();
        return res.status(409).json({ success: false, message: 'Email already in use' });
      }
    }

    await employee.update({
      name: name || employee.name,
      email: email || employee.email,
      phone: phone || employee.phone,
      profile_image,
      gender: gender || employee.gender,
      dob: dob || employee.dob,
      father_name: father_name || employee.father_name,
      relation: relation || employee.relation,
      marital_status: marital_status || employee.marital_status,
      designation: designation || employee.designation,
      department: department || employee.department,
      location: location || employee.location,
      client_id: client_id || employee.client_id,
      date_of_joining: date_of_joining || employee.date_of_joining,
      status: status || employee.status,
    }, { transaction });

    if (kyc) {
      const existingKyc = await EmployeeKyc.findOne({ where: { employee_id: employee.id }, transaction });
      if (existingKyc) {
        await existingKyc.update({
          uan_pf: kyc.uan_pf || existingKyc.uan_pf,
          esi: kyc.esi || existingKyc.esi,
          bank_account: kyc.bank_account || existingKyc.bank_account,
          bank_name: kyc.bank_name || existingKyc.bank_name,
          ifsc: kyc.ifsc || existingKyc.ifsc,
          pan: kyc.pan || existingKyc.pan,
          aadhar_number: kyc.aadhar_number || existingKyc.aadhar_number,
        }, { transaction });
      }
    }

    if (Array.isArray(addresses)) {
      await EmployeeAddress.destroy({ where: { employee_id: employee.id }, transaction });
      if (addresses.length > 0) {
        await EmployeeAddress.bulkCreate(
          addresses.map((a) => ({
            employee_id: employee.id,
            address_type: a.address_type || 'present',
            address: a.address, district: a.district, state: a.state, pin: a.pin,
            country: a.country || 'India',
          })), { transaction }
        );
      }
    }

    if (Array.isArray(nominees)) {
      await EmployeeNominee.destroy({ where: { employee_id: employee.id }, transaction });
      if (nominees.length > 0) {
        await EmployeeNominee.bulkCreate(
          nominees.map((n) => ({
            employee_id: employee.id,
            name: n.name, address: n.address, dob: n.dob, relation: n.relation,
          })), { transaction }
        );
      }
    }

    if (Array.isArray(families)) {
      await EmployeeFamily.destroy({ where: { employee_id: employee.id }, transaction });
      if (families.length > 0) {
        await EmployeeFamily.bulkCreate(
          families.map((f) => ({
            employee_id: employee.id,
            name: f.name, relation: f.relation, dob: f.dob, address: f.address, aadhar: f.aadhar,
          })), { transaction }
        );
      }
    }

    await transaction.commit();

    const updatedEmployee = employee.toJSON();
    delete updatedEmployee.password;

    return res.status(200).json({
      success: true,
      message: 'Employee updated successfully',
      data: updatedEmployee,
    });
  } catch (err) {
    await transaction.rollback();
    console.error('Update employee error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
  }
};

exports.updateEmployeeStatus = async (req, res) => {
  try {
    if (!req.user || !req.user.role || req.user.role.slug !== 'company') {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'inactive'].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status. Allowed: 'active', 'inactive'." });
    }

    const employee = await Employee.findOne({
      where: { id, company_id: req.user.id },
    });

    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    employee.status = status;
    await employee.save();

    return res.status(200).json({
      success: true,
      message: `Employee status updated to ${status} successfully`,
      data: {
        id: employee.id,
        name: employee.name,
        status: employee.status,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
  }
};

exports.deleteEmployee = async (req, res) => {
  const transaction = await Employee.sequelize.transaction();

  try {
    const employee = await Employee.findOne({
      where: { id: req.params.id, company_id: req.user.id },
      transaction,
    });

    if (!employee) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Employee not found.' });
    }

    await Leave.update({ approved_by: null }, { where: { approved_by: employee.id }, transaction });
    await SalaryRevision.update({ approved_by: null }, { where: { approved_by: employee.id }, transaction });

    await Payroll.destroy({ where: { employee_id: employee.id, company_id: req.user.id }, transaction });
    await Attendance.destroy({ where: { employee_id: employee.id, company_id: req.user.id }, transaction });
    await Leave.destroy({ where: { employee_id: employee.id, company_id: req.user.id }, transaction });
    await LeaveBalance.destroy({ where: { employee_id: employee.id }, transaction });
    await SalaryRevision.destroy({ where: { employee_id: employee.id }, transaction });
    await Document.destroy({ where: { employee_id: employee.id, company_id: req.user.id }, transaction });
    await EmployeeKyc.destroy({ where: { employee_id: employee.id }, transaction });
    await EmployeeSalary.destroy({ where: { employee_id: employee.id }, transaction });
    await EmployeeAddress.destroy({ where: { employee_id: employee.id }, transaction });
    await EmployeeNominee.destroy({ where: { employee_id: employee.id }, transaction });
    await EmployeeFamily.destroy({ where: { employee_id: employee.id }, transaction });
    await employee.destroy({ transaction });
    await transaction.commit();

    return res.status(200).json({
      success: true,
      message: 'Employee and related records deleted successfully.',
      data: { id: employee.id },
    });
  } catch (err) {
    await transaction.rollback();
    console.error('Delete employee error:', err);
    return res.status(500).json({ success: false, message: 'Unable to delete employee.', error: err.message });
  }
};


//it will use during payroll generation 

exports.getEmployeeForDropdown = async (req, res) => {
  try {
    if (!req.user || !req.user.role || req.user.role.slug !== 'company') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only company can view employees.',
      });
    }

    const company_id = req.user.id;
    const { search, status, month, year } = req.query;
    const payrollMonth = Number(month);
    const payrollYear = Number(year);

    if (!Number.isInteger(payrollMonth) || payrollMonth < 1 || payrollMonth > 12 || !Number.isInteger(payrollYear) || payrollYear < 1900) {
      return res.status(400).json({ success: false, message: 'A valid month (1–12) and year are required.' });
    }

    const where = { company_id, status: status || 'active' };

    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { employee_id: { [Op.like]: `%${search}%` } },
      ];
    }

    const payrollsForPeriod = await Payroll.findAll({
      where: { company_id, month: payrollMonth, year: payrollYear },
      attributes: ['employee_id'],
      raw: true,
    });
    const payrollEmployeeIds = [...new Set(payrollsForPeriod.map((payroll) => payroll.employee_id))];
    if (payrollEmployeeIds.length) where.id = { [Op.notIn]: payrollEmployeeIds };

    const employees = await Employee.findAll({
      where,
      order: [['name', 'ASC']],
      attributes: ['id', 'name', 'employee_id'],
    });

    return res.status(200).json({
      success: true,
      message: `Employees without payroll for ${payrollMonth}/${payrollYear} fetched successfully.`,
      data: employees,
    });
  } catch (err) {
    console.error('Get dropdown employees error:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: err.message,
    });
  }
};

exports.createPayroll = async (req, res) => {
  const transaction = await Employee.sequelize.transaction();

  try {
    const company_id = req.user.id;
    const {
      employee_id, month, year, working_days, present_days,
      leave_days, absent_days, basic, hra, conveyance,
      medical_allowance, special_allowance, bonus, overtime_amount,
      pf_deduction, esi_deduction, tax_deduction, other_deduction, status
    } = req.body;

    if (!employee_id || !month || !year || !working_days) {
      await transaction.rollback();
      return res.status(400).json({ 
        success: false, 
        message: 'Required fields missing (employee_id, month, year, working_days)' 
      });
    }

    const employee = await Employee.findOne({ 
      where: { id: employee_id, company_id }, 
      transaction 
    });
    
    if (!employee) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Employee not found in your company.' });
    }
    
    if (employee.status !== 'active') {
      await transaction.rollback();
      return res.status(400).json({ 
        success: false, 
        message: `Cannot generate payroll. Employee is currently ${employee.status}.` 
      });
    }

    const existingPayroll = await Payroll.findOne({ 
      where: { employee_id, month, year, company_id }, 
      transaction 
    });
    
    if (existingPayroll) {
      await transaction.rollback();
      return res.status(409).json({ 
        success: false, 
        message: `Payroll for ${month}/${year} is already generated for this employee.` 
      });
    }

    const periodEnd = payrollPeriodEnd(month, year);
    if (!periodEnd) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: 'A valid payroll month and year are required.' });
    }
    const baseSalary = await EmployeeSalary.findOne({ where: { employee_id: employee.id }, transaction });
    const effective = await resolveEffectiveSalary(employee.id, baseSalary, periodEnd, transaction);
    const salary = effective.salary || {};
    const fBasic = Number(salary.basic) || 0;
    const fHra = Number(salary.hra) || 0;
    const fConveyance = Number(salary.conveyance) || 0;
    const fMedical = Number(salary.medical_allowance) || 0;
    const fSpecial = Number(salary.special_allowance) || 0;
    const fFixedBonus = Number(salary.fixed_bonus) || 0;
    const fBonus = parseFloat(bonus) || 0;
    const fOvertime = parseFloat(overtime_amount) || 0;

    const gross_salary = fBasic + fHra + fConveyance + fMedical + fSpecial + fFixedBonus + fBonus + fOvertime;

    const fPfDeduction = Number(salary.pf_basic) || 0;
    const fEsiDeduction = salary.esic_applicable === 'yes' ? Math.round((Number(salary.total) || 0) * 0.0075 * 100) / 100 : 0;
    const fTaxDeduction = parseFloat(tax_deduction) || 0;
    const fOtherDeduction = parseFloat(other_deduction) || 0;

    const total_deduction = fPfDeduction + fEsiDeduction + fTaxDeduction + fOtherDeduction;
    const net_salary = gross_salary - total_deduction;

    if (net_salary < 0) {
      await transaction.rollback();
      return res.status(400).json({ 
        success: false, 
        message: 'Deductions cannot be greater than Gross Salary. Net Salary cannot be negative.' 
      });
    }

    const payroll = await Payroll.create({
      employee_id: employee.id,
      company_id,
      salary_revision_id: effective.revision?.id || null,
      month,
      year,
      working_days: parseInt(working_days) || 0,
      present_days: parseFloat(present_days) || 0,
      leave_days: parseFloat(leave_days) || 0,
      absent_days: parseFloat(absent_days) || 0,
      basic: fBasic,
      hra: fHra,
      conveyance: fConveyance,
      medical_allowance: fMedical,
      special_allowance: fSpecial,
      fixed_bonus: fFixedBonus,
      bonus: fBonus,
      overtime_amount: fOvertime,
      gross_salary: gross_salary, 
      pf_deduction: fPfDeduction,
      esi_deduction: fEsiDeduction,
      tax_deduction: fTaxDeduction,
      other_deduction: fOtherDeduction,
      total_deduction: total_deduction, 
      net_salary: net_salary,
      status: status || 'processed',
      paid_at: status === 'paid' ? new Date() : null,
    }, { transaction });

    await transaction.commit();

    return res.status(201).json({
      success: true,
      message: 'Payroll created successfully',
      data: payroll,
    });

  } catch (err) {
    await transaction.rollback();
    console.error('Create payroll error:', err);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error', 
      error: err.message 
    });
  }
};


exports.updatePayroll = async (req, res) => {
  const transaction = await Employee.sequelize.transaction();

  try {
    const company_id = req.user.id;
    const { id } = req.params;
    const {
      working_days, present_days, leave_days, absent_days,
      basic, hra, conveyance, medical_allowance, special_allowance, fixed_bonus, bonus, overtime_amount,
      pf_deduction, esi_deduction, tax_deduction, other_deduction, status
    } = req.body;

    const payroll = await Payroll.findOne({
      where: { id, company_id },
      transaction
    });

    if (!payroll) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Payroll record not found.' });
    }

    if (payroll.status === 'paid' && status !== 'paid') {
      await transaction.rollback();
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot modify a paid payroll to another status.' 
      });
    }

    const fBasic = parseFloat(basic ?? payroll.basic) || 0;
    const fHra = parseFloat(hra ?? payroll.hra) || 0;
    const fConveyance = parseFloat(conveyance ?? payroll.conveyance) || 0;
    const fMedical = parseFloat(medical_allowance ?? payroll.medical_allowance) || 0;
    const fSpecial = parseFloat(special_allowance ?? payroll.special_allowance) || 0;
    const fFixedBonus = parseFloat(fixed_bonus ?? payroll.fixed_bonus) || 0;
    const fBonus = parseFloat(bonus ?? payroll.bonus) || 0;
    const fOvertime = parseFloat(overtime_amount ?? payroll.overtime_amount) || 0;

    const gross_salary = fBasic + fHra + fConveyance + fMedical + fSpecial + fFixedBonus + fBonus + fOvertime;

    const fPfDeduction = parseFloat(pf_deduction ?? payroll.pf_deduction) || 0;
    const fEsiDeduction = parseFloat(esi_deduction ?? payroll.esi_deduction) || 0;
    const fTaxDeduction = parseFloat(tax_deduction ?? payroll.tax_deduction) || 0;
    const fOtherDeduction = parseFloat(other_deduction ?? payroll.other_deduction) || 0;

    const total_deduction = fPfDeduction + fEsiDeduction + fTaxDeduction + fOtherDeduction;
    const net_salary = gross_salary - total_deduction;

    if (net_salary < 0) {
      await transaction.rollback();
      return res.status(400).json({ 
        success: false, 
        message: 'Deductions cannot be greater than Gross Salary. Net Salary cannot be negative.' 
      });
    }

    const updatedStatus = status || payroll.status;

    await payroll.update({
      working_days: working_days !== undefined ? parseInt(working_days) : payroll.working_days,
      present_days: present_days !== undefined ? parseFloat(present_days) : payroll.present_days,
      leave_days: leave_days !== undefined ? parseFloat(leave_days) : payroll.leave_days,
      absent_days: absent_days !== undefined ? parseFloat(absent_days) : payroll.absent_days,
      basic: fBasic,
      hra: fHra,
      conveyance: fConveyance,
      medical_allowance: fMedical,
      special_allowance: fSpecial,
      fixed_bonus: fFixedBonus,
      bonus: fBonus,
      overtime_amount: fOvertime,
      gross_salary: gross_salary,
      pf_deduction: fPfDeduction,
      esi_deduction: fEsiDeduction,
      tax_deduction: fTaxDeduction,
      other_deduction: fOtherDeduction,
      total_deduction: total_deduction,
      net_salary: net_salary,
      status: updatedStatus,
      paid_at: updatedStatus === 'paid' && payroll.status !== 'paid' ? new Date() : payroll.paid_at,
    }, { transaction });

    await transaction.commit();

    return res.status(200).json({
      success: true,
      message: 'Payroll updated successfully',
      data: payroll,
    });

  } catch (err) {
    await transaction.rollback();
    console.error('Update payroll error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
  }
};

exports.updatePayrollStatus = async (req, res) => {
  try {
    const company_id = req.user.id;
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'processed', 'paid'].includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid status. Allowed values: 'pending', 'processed', 'paid'." 
      });
    }

    const payroll = await Payroll.findOne({ where: { id, company_id } });

    if (!payroll) {
      return res.status(404).json({ success: false, message: 'Payroll record not found.' });
    }

    if (payroll.status === 'paid') {
      return res.status(400).json({ success: false, message: 'Payroll is already marked as paid.' });
    }

    payroll.status = status;
    payroll.paid_at = status === 'paid' ? new Date() : null;
    await payroll.save();

    return res.status(200).json({
      success: true,
      message: `Payroll status updated to ${status} successfully`,
      data: payroll,
    });

  } catch (err) {
    console.error('Update payroll status error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
  }
};

exports.getPayrollById = async (req, res) => {
  try {
    const company_id = req.user.id;
    const { id } = req.params;

    const payroll = await Payroll.findOne({
      where: { id, company_id },
      include: [
        {
          model: Employee,
          as: 'employee',
          attributes: ['id', 'employee_id', 'name', 'email', 'designation', 'department', 'profile_image'],
        },
        { model: SalaryRevision, as: 'salary_revision', attributes: ['id', 'effective_from', 'old_salary', 'new_salary'] },
      ],
    });

    if (!payroll) {
      return res.status(404).json({ success: false, message: 'Payroll record not found.' });
    }

    return res.status(200).json({
      success: true,
      message: 'Payroll fetched successfully',
      data: payroll,
    });
  } catch (err) {
    console.error('Get payroll by id error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
  }
};

exports.getAllPayrolls = async (req, res) => {
  try {
    const company_id = req.user.id;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { search, month, year, status, employee_id } = req.query;

    const where = { company_id };

    if (month) where.month = month;
    if (year) where.year = year;
    if (status) where.status = status;
    if (employee_id) where.employee_id = employee_id;

    const employeeWhere = {};
    if (search) {
      employeeWhere[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { employee_id: { [Op.like]: `%${search}%` } },
      ];
    }

    const { count, rows } = await Payroll.findAndCountAll({
      where,
      limit,
      offset,
      order: [['year', 'DESC'], ['month', 'DESC'], ['id', 'DESC']],
      include: [
        {
          model: Employee,
          as: 'employee',
          attributes: ['id', 'employee_id', 'name', 'designation', 'department'],
          where: Object.keys(employeeWhere).length ? employeeWhere : undefined,
          required: Object.keys(employeeWhere).length ? true : false,
        },
        { model: SalaryRevision, as: 'salary_revision', attributes: ['id', 'effective_from', 'old_salary', 'new_salary'] },
      ],
      distinct: true,
    });

    return res.status(200).json({
      success: true,
      message: 'Payrolls fetched successfully',
      data: {
        payrolls: rows,
        pagination: {
          total: count,
          page,
          limit,
          totalPages: Math.ceil(count / limit),
        },
      },
    });
  } catch (err) {
    console.error('Get all payrolls error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
  }
};

exports.deletePayroll = async (req, res) => {
  try {
    const company_id = req.user.id;
    const { id } = req.params;

    const payroll = await Payroll.findOne({ where: { id, company_id } });

    if (!payroll) {
      return res.status(404).json({ success: false, message: 'Payroll record not found.' });
    }

    if (payroll.status === 'paid') {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot delete a payroll that has already been paid.' 
      });
    }

    await payroll.destroy();

    return res.status(200).json({
      success: true,
      message: 'Payroll deleted successfully',
    });

  } catch (err) {
    console.error('Delete payroll error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
  }
};



exports.getSalarySlipListing = async (req, res) => {
  try {
    const company_id = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { search, month, year, status } = req.query;

    const where = { company_id };
    if (month) where.month = month;
    if (year) where.year = year;
    if (status) where.status = status;

    const employeeWhere = {};
    if (search) {
      employeeWhere[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { employee_id: { [Op.like]: `%${search}%` } },
      ];
    }

    const { count, rows } = await Payroll.findAndCountAll({
      where,
      limit,
      offset,
      order: [['year', 'DESC'], ['month', 'DESC'], ['id', 'DESC']],
      attributes: [
        'id', 'month', 'year', 'gross_salary', 'net_salary', 
        'total_deduction', 'status', 'salary_revision_id', 'createdAt'
      ],
      include: [
        {
          model: Employee,
          as: 'employee',
          attributes: ['id', 'employee_id', 'name', 'designation', 'department'],
          where: Object.keys(employeeWhere).length ? employeeWhere : undefined,
          required: Object.keys(employeeWhere).length ? true : false,
        },
        { model: SalaryRevision, as: 'salary_revision', attributes: ['id', 'effective_from', 'old_salary', 'new_salary'] },
      ],
      distinct: true,
    });

    return res.status(200).json({
      success: true,
      message: 'Salary slips fetched successfully',
      data: {
        slips: rows,
        pagination: {
          total: count,
          page,
          limit,
          totalPages: Math.ceil(count / limit),
        },
      },
    });
  } catch (err) {
    console.error('Get salary slip listing error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
  }
};

exports.getSalarySlipView = async (req, res) => {
  try {
    const company_id = req.user.id;
    const { id } = req.params;

    const payroll = await Payroll.findOne({
      where: { id, company_id },
      include: [
        {
          model: Employee,
          as: 'employee',
          attributes: ['id', 'name', 'employee_id', 'email', 'designation', 'department', 'date_of_joining', 'phone', 'profile_image'],
          include: [
            {
              model: EmployeeKyc,
              as: 'kyc',
              attributes: ['uan_pf', 'bank_account', 'bank_name', 'ifsc', 'pan', 'aadhar_number']
            }
          ]
        },
        {
          model: Company,
          as: 'company',
          attributes: ['company_name', 'email', 'logo', 'cin_number', 'website', 'address']
        },
        { model: SalaryRevision, as: 'salary_revision', attributes: ['id', 'effective_from', 'old_salary', 'new_salary'] }
      ]
    });

    if (!payroll) {
      return res.status(404).json({ success: false, message: 'Salary slip not found.' });
    }

    return res.status(200).json({
      success: true,
      message: 'Salary slip details fetched successfully',
      data: payroll,
    });
  } catch (err) {
    console.error('View salary slip error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
  }
};





exports.downloadSalarySlip = async (req, res) => {
  const payrollId = Number(req.params.id);
  if (!Number.isSafeInteger(payrollId) || payrollId < 1) {
    return res.status(404).json({ success: false, message: 'Salary slip not found.' });
  }

  try {
    const payroll = await Payroll.findOne({
      where: { id: payrollId, company_id: req.user.id },
      include: [
        {
          model: Employee,
          as: 'employee',
          attributes: ['id', 'name', 'employee_id', 'designation', 'department', 'location', 'date_of_joining'],
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

    if (!payroll) {
      return res.status(404).json({ success: false, message: 'Salary slip not found.' });
    }

    return sendSalarySlipPdf(res, payroll);
  } catch (error) {
    console.error('Company salary slip download error:', error);
    if (res.headersSent) return res.destroy(error);
    return res.status(500).json({ success: false, message: 'Unable to generate the salary slip.' });
  }
};
