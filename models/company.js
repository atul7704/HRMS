module.exports = (sequelize, DataTypes) => {
  const Company = sequelize.define('Company', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

    company_name: { type: DataTypes.STRING(150), allowNull: false },
    email: {
      type: DataTypes.STRING(150),
      allowNull: false,
      unique: true,
      validate: { isEmail: true },
    },
    password: { type: DataTypes.STRING(255), allowNull: false },
    phone: { type: DataTypes.STRING(15), allowNull: true },
    logo: { type: DataTypes.STRING(255), allowNull: true },

    cin_number: { type: DataTypes.STRING(21), allowNull: true, unique: true },
    gst_number: { type: DataTypes.STRING(15), allowNull: true, unique: true },
    pan_number: { type: DataTypes.STRING(10), allowNull: true },
    tan_number: { type: DataTypes.STRING(10), allowNull: true },

    website: { type: DataTypes.STRING(150), allowNull: true },
    industry_type: { type: DataTypes.STRING(100), allowNull: true },
    established_date: { type: DataTypes.DATEONLY, allowNull: true },
    employee_count: { type: DataTypes.INTEGER, defaultValue: 0 },

    address: { type: DataTypes.TEXT, allowNull: true },
    city: { type: DataTypes.STRING(100), allowNull: true },
    state: { type: DataTypes.STRING(100), allowNull: true },
    country: { type: DataTypes.STRING(100), defaultValue: 'India' },
    pincode: { type: DataTypes.STRING(10), allowNull: true },

    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      defaultValue: 'active',
    },
     reset_otp: { type: DataTypes.STRING(10), allowNull: true },
    reset_otp_expiry: { type: DataTypes.DATE, allowNull: true },
    last_login: { type: DataTypes.DATE, allowNull: true },
  }, {
    tableName: 'companies',
    timestamps: true,
  });


  return Company;
};