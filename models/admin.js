module.exports = (sequelize, DataTypes) => {
  const Admin = sequelize.define('Admin', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

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
        reset_otp: { type: DataTypes.STRING(10), allowNull: true },
    reset_otp_expiry: { type: DataTypes.DATE, allowNull: true },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      defaultValue: 'active',
    },
    last_login: { type: DataTypes.DATE, allowNull: true },
  }, {
    tableName: 'admins',
    timestamps: true,
  });

  return Admin;
};