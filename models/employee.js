module.exports = (sequelize, DataTypes) => {
  const Employee = sequelize.define('Employee', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    employee_id: { type: DataTypes.STRING(20), allowNull: true, unique: true },
    company_id: { type: DataTypes.INTEGER, allowNull: false },

    name: { type: DataTypes.STRING(100), allowNull: false },
    email: {
      type: DataTypes.STRING(150),
      allowNull: false,
      unique: true,
      validate: { isEmail: true },
    },
    password: { type: DataTypes.STRING(255), allowNull: false },
    phone: { type: DataTypes.STRING(15), allowNull: true },
    profile_image: { type: DataTypes.STRING(255), allowNull: true },

    gender: { type: DataTypes.ENUM('male', 'female', 'other'), allowNull: true },
    dob: { type: DataTypes.DATEONLY, allowNull: true },
    father_name: { type: DataTypes.STRING(150), allowNull: true },
    relation: { type: DataTypes.ENUM('father', 'spouse'), allowNull: true },
    marital_status: {
      type: DataTypes.ENUM('single', 'married', 'divorced', 'widowed'),
      allowNull: true,
    },

    designation: { type: DataTypes.STRING(100), allowNull: true },
    department: { type: DataTypes.STRING(100), allowNull: true },
    location: { type: DataTypes.STRING(150), allowNull: true },
    client_id: { type: DataTypes.STRING(50), allowNull: true },
    date_of_joining: { type: DataTypes.DATEONLY, allowNull: true },
       reset_otp: { type: DataTypes.STRING(10), allowNull: true },
    reset_otp_expiry: { type: DataTypes.DATE, allowNull: true },
    status: { type: DataTypes.ENUM('active', 'inactive'), defaultValue: 'active' },
    last_login: { type: DataTypes.DATE, allowNull: true },
  }, {
    tableName: 'employees',
    timestamps: true,
  });

 

  return Employee;
};