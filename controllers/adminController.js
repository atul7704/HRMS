const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Admin, Role,Company } = require('../models');
const nodemailer = require('nodemailer');
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const { Op } = require('sequelize');
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;



exports.login = async (req, res) => {
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

    const admin = await Admin.findOne({ where: { email } });
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    if (admin.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Account is inactive. Contact support.',
      });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    const role = await Role.findOne({ where: { slug: 'super-admin' } });
    if (!role) {
      return res.status(500).json({
        success: false,
        message: 'Role configuration missing',
      });
    }

    const token = jwt.sign(
      {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        phone: admin.phone,
        profile_image: admin.profile_image,
        role: {
          id: role.id,
          name: role.name,
          slug: role.slug,
        },
        status: admin.status,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    admin.last_login = new Date();
    await admin.save();

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        admin: {
          id: admin.id,
          name: admin.name,
          email: admin.email,
          phone: admin.phone,
          profile_image: admin.profile_image,
          status: admin.status,
          last_login: admin.last_login,
          role: {
            id: role.id,
            name: role.name,
            slug: role.slug,
          },
        },
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: err.message,
    });
  }
};




exports.createCompany = async (req, res) => {
  try {
    const {
      company_name,
      email,
      password,
      phone,
      cin_number,
      gst_number,
      pan_number,
      tan_number,
      website,
      industry_type,
      established_date,
      employee_count,
      address,
      city,
      state,
      country,
      pincode,
    } = req.body;

    const logo = req.file ? `/${req.file.path.replace(/\\/g, '/')}` : null;

    if (!company_name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Company name, email and password are required',
      });
    }

    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format',
      });
    }

    if (!PASSWORD_REGEX.test(password)) {
      return res.status(400).json({
        success: false,
        message:
          'Password must be at least 8 characters and include uppercase, lowercase, number, and special character',
      });
    }

    const existingCompany = await Company.findOne({ where: { email } });
    if (existingCompany) {
      return res.status(409).json({
        success: false,
        message: 'Company with this email already exists',
      });
    }

    if (cin_number) {
      const existingCin = await Company.findOne({ where: { cin_number } });
      if (existingCin) {
        return res.status(409).json({
          success: false,
          message: 'Company with this CIN already exists',
        });
      }
    }

    if (gst_number) {
      const existingGst = await Company.findOne({ where: { gst_number } });
      if (existingGst) {
        return res.status(409).json({
          success: false,
          message: 'Company with this GST already exists',
        });
      }
    }

    const role = await Role.findOne({ where: { slug: 'company' } });
    if (!role) {
      return res.status(500).json({
        success: false,
        message: 'Company role not configured',
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const company = await Company.create({
      company_name,
      email,
      password: hashedPassword,
      phone,
      logo,
      cin_number,
      gst_number,
      pan_number,
      tan_number,
      website,
      industry_type,
      established_date,
      employee_count: employee_count || 0,
      address,
      city,
      state,
      country: country || 'India',
      pincode,
      status: 'active',
    });

    return res.status(201).json({
      success: true,
      message: 'Company created successfully',
      data: {
        id: company.id,
        company_name: company.company_name,
        email: company.email,
        phone: company.phone,
        logo: company.logo,
        cin_number: company.cin_number,
        gst_number: company.gst_number,
        status: company.status,
        role: {
          id: role.id,
          name: role.name,
          slug: role.slug,
        },
      },
    });
  } catch (err) {
    console.error('Create company error:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: err.message,
    });
  }
};





exports.getCompanyById = async (req, res) => {
  try {
    const company = await Company.findByPk(req.params.id, {
      attributes: { exclude: ['password'] },
    });

    if (!company) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }

    return res.status(200).json({ success: true, data: company });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
  }
};

exports.updateCompany = async (req, res) => {
  try {
    const { id } = req.params;
    const company = await Company.findByPk(id);

    if (!company) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }

    const logo = req.file ? `/${req.file.path.replace(/\\/g, '/')}` : company.logo;
    
    const {
      company_name, email, phone, cin_number, gst_number, pan_number, 
      tan_number, website, industry_type, established_date, employee_count, 
      address, city, state, country, pincode, status
    } = req.body;

    if (email && email !== company.email) {
      const existingEmail = await Company.findOne({ where: { email } });
      if (existingEmail) {
        return res.status(409).json({ success: false, message: 'Email already in use' });
      }
    }

    const optionalValue = (value, currentValue) => value === undefined
      ? currentValue
      : value === ''
        ? null
        : value;

    await company.update({
      company_name: company_name || company.company_name,
      email: email || company.email,
      phone: optionalValue(phone, company.phone),
      logo,
      cin_number: optionalValue(cin_number, company.cin_number),
      gst_number: optionalValue(gst_number, company.gst_number),
      pan_number: optionalValue(pan_number, company.pan_number),
      tan_number: optionalValue(tan_number, company.tan_number),
      website: optionalValue(website, company.website),
      industry_type: optionalValue(industry_type, company.industry_type),
      established_date: optionalValue(established_date, company.established_date),
      employee_count: employee_count !== undefined && employee_count !== '' ? Number(employee_count) : company.employee_count,
      address: optionalValue(address, company.address),
      city: optionalValue(city, company.city),
      state: optionalValue(state, company.state),
      country: optionalValue(country, company.country),
      pincode: optionalValue(pincode, company.pincode),
      status: status || company.status,
    });

    const updatedCompany = company.toJSON();
    delete updatedCompany.password;

    return res.status(200).json({
      success: true,
      message: 'Company updated successfully',
      data: updatedCompany,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
  }
};

exports.getAllCompanies = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { search, status, city, industry_type } = req.query;

    let whereClause = {};

    if (search) {
      whereClause[Op.or] = [
        { company_name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { phone: { [Op.like]: `%${search}%` } },
      ];
    }

    if (status) whereClause.status = status;
    if (city) whereClause.city = city;
    if (industry_type) whereClause.industry_type = industry_type;

    const { count, rows } = await Company.findAndCountAll({
      where: whereClause,
      attributes: { exclude: ['password'] },
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    });

    return res.status(200).json({
      success: true,
      message: 'Companies fetched successfully',
      data: rows,
      meta: {
        total_items: count,
        current_page: page,
        total_pages: Math.ceil(count / limit),
        limit,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
  }
};

exports.updateCompanyStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'inactive'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Allowed values are 'active' or 'inactive'.",
      });
    }

    const company = await Company.findByPk(id);

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found',
      });
    }

    company.status = status;
    await company.save();

    return res.status(200).json({
      success: true,
      message: `Company status updated to ${status} successfully`,
      data: {
        id: company.id,
        company_name: company.company_name,
        status: company.status,
      },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: err.message,
    });
  }
};




exports.forgetPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const admin = await Admin.findOne({ where: { email } });
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin with this email does not exist' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    admin.reset_otp = otp;
    admin.reset_otp_expiry = otpExpiry;
    await admin.save();

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"HRMS Support" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Admin Password Reset OTP',
      text: `Your OTP is ${otp}. It is valid for 10 minutes.`,
    });

    return res.status(200).json({ success: true, message: 'OTP sent to email successfully' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
  }
};

exports.verifyResetOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and OTP are required' });
    }

    const admin = await Admin.findOne({
      where: {
        email,
        reset_otp: otp,
        reset_otp_expiry: { [Op.gt]: new Date() },
      },
      attributes: ['id', 'email'],
    });

    if (!admin) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    return res.status(200).json({
      success: true,
      message: 'OTP verified successfully',
      data: { email: admin.email },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Unable to verify OTP', error: err.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, new_password } = req.body;

    if (!email || !otp || !new_password) {
      return res.status(400).json({ success: false, message: 'Email, OTP, and new password are required' });
    }

    const admin = await Admin.findOne({
      where: {
        email,
        reset_otp: otp,
        reset_otp_expiry: { [Op.gt]: new Date() },
      },
    });

    if (!admin) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    const hashedPassword = await bcrypt.hash(new_password, 10);

    admin.password = hashedPassword;
    admin.reset_otp = null;
    admin.reset_otp_expiry = null;
    await admin.save();

    return res.status(200).json({
      success: true,
      message: 'Password reset successfully. You can login now.',
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
  }
};
