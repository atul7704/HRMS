const sequelize = require('../config/database');
const { DataTypes } = require('sequelize');

const Role = require('./role')(sequelize, DataTypes);
const Admin = require('./admin')(sequelize, DataTypes);
const Company = require('./company')(sequelize, DataTypes);
const Employee = require('./employee')(sequelize, DataTypes);
const EmployeeKyc = require('./employeekyc')(sequelize, DataTypes);
const EmployeeSalary = require('./employeesalary')(sequelize, DataTypes);
const EmployeeAddress = require('./employeeaddress')(sequelize, DataTypes);
const EmployeeNominee = require('./employeenominee')(sequelize, DataTypes);
const EmployeeFamily = require('./employeefamily')(sequelize, DataTypes);

const Department = require('./department')(sequelize, DataTypes);
const Designation = require('./designation')(sequelize, DataTypes);
const MasterBank = require('./masterbank')(sequelize, DataTypes);
const MasterDepartment = require('./masterdepartment')(sequelize, DataTypes);
const MasterDesignation = require('./masterdesignation')(sequelize, DataTypes);
const Attendance = require('./attendance')(sequelize, DataTypes);
const AttendanceEvent = require('./attendanceevent')(sequelize, DataTypes);
const Leave = require('./leave')(sequelize, DataTypes);
const LeaveBalance = require('./leavebalance')(sequelize, DataTypes);
const Holiday = require('./holiday')(sequelize, DataTypes);
const Payroll = require('./payroll')(sequelize, DataTypes);
const SalaryRevision = require('./salaryrevision')(sequelize, DataTypes);
const Document = require('./document')(sequelize, DataTypes);
const Announcement = require('./announcement')(sequelize, DataTypes);
const Notification = require('./notification')(sequelize, DataTypes);
const ActivityLog = require('./activitylog')(sequelize, DataTypes);

const db = {
  sequelize,
  Sequelize: sequelize.constructor,

  Role,
  Admin,
  Company,
  Employee,
  EmployeeKyc,
  EmployeeSalary,
  EmployeeAddress,
  EmployeeNominee,
  EmployeeFamily,

  Department,
  Designation,
  MasterBank,
  MasterDepartment,
  MasterDesignation,
  Attendance,
  AttendanceEvent,
  Leave,
  LeaveBalance,
  Holiday,
  Payroll,
  SalaryRevision,
  Document,
  Announcement,
  Notification,
  ActivityLog,
};

// Role.hasMany(Admin, { foreignKey: 'role_id', as: 'admins' });
// Admin.belongsTo(Role, { foreignKey: 'role_id', as: 'role' });

// Role.hasMany(Company, { foreignKey: 'role_id', as: 'companies' });
// Company.belongsTo(Role, { foreignKey: 'role_id', as: 'role' });

// Role.hasMany(Employee, { foreignKey: 'role_id', as: 'employees' });
// Employee.belongsTo(Role, { foreignKey: 'role_id', as: 'role' });

Company.hasMany(Employee, { foreignKey: 'company_id', as: 'employees' });
Employee.belongsTo(Company, { foreignKey: 'company_id', as: 'company' });

Employee.hasOne(EmployeeKyc, { foreignKey: 'employee_id', as: 'kyc' });
EmployeeKyc.belongsTo(Employee, { foreignKey: 'employee_id', as: 'employee' });

Employee.hasOne(EmployeeSalary, { foreignKey: 'employee_id', as: 'salary' });
EmployeeSalary.belongsTo(Employee, { foreignKey: 'employee_id', as: 'employee' });

Employee.hasMany(EmployeeAddress, { foreignKey: 'employee_id', as: 'addresses' });
EmployeeAddress.belongsTo(Employee, { foreignKey: 'employee_id', as: 'employee' });

Employee.hasMany(EmployeeNominee, { foreignKey: 'employee_id', as: 'nominees' });
EmployeeNominee.belongsTo(Employee, { foreignKey: 'employee_id', as: 'employee' });

Employee.hasMany(EmployeeFamily, { foreignKey: 'employee_id', as: 'families' });
EmployeeFamily.belongsTo(Employee, { foreignKey: 'employee_id', as: 'employee' });

Company.hasMany(Department, { foreignKey: 'company_id', as: 'departments' });
Department.belongsTo(Company, { foreignKey: 'company_id', as: 'company' });

Department.hasMany(Designation, { foreignKey: 'department_id', as: 'designations' });
Designation.belongsTo(Department, { foreignKey: 'department_id', as: 'department' });

Company.hasMany(Designation, { foreignKey: 'company_id', as: 'designations' });
Designation.belongsTo(Company, { foreignKey: 'company_id', as: 'company' });

MasterDepartment.hasMany(MasterDesignation, { foreignKey: 'department_id', as: 'designations' });
MasterDesignation.belongsTo(MasterDepartment, { foreignKey: 'department_id', as: 'department' });

Employee.hasMany(Attendance, { foreignKey: 'employee_id', as: 'attendances' });
Attendance.belongsTo(Employee, { foreignKey: 'employee_id', as: 'employee' });
Attendance.hasMany(AttendanceEvent, { foreignKey: 'attendance_id', as: 'events' });
AttendanceEvent.belongsTo(Attendance, { foreignKey: 'attendance_id', as: 'attendance' });

Company.hasMany(Attendance, { foreignKey: 'company_id', as: 'attendances' });
Attendance.belongsTo(Company, { foreignKey: 'company_id', as: 'company' });

Employee.hasMany(Leave, { foreignKey: 'employee_id', as: 'leaves' });
Leave.belongsTo(Employee, { foreignKey: 'employee_id', as: 'employee' });

Company.hasMany(Leave, { foreignKey: 'company_id', as: 'leaves' });
Leave.belongsTo(Company, { foreignKey: 'company_id', as: 'company' });

Leave.belongsTo(Employee, { foreignKey: 'approved_by', as: 'approver' });

Employee.hasMany(LeaveBalance, { foreignKey: 'employee_id', as: 'leave_balances' });
LeaveBalance.belongsTo(Employee, { foreignKey: 'employee_id', as: 'employee' });

Company.hasMany(Holiday, { foreignKey: 'company_id', as: 'holidays' });
Holiday.belongsTo(Company, { foreignKey: 'company_id', as: 'company' });

Employee.hasMany(Payroll, { foreignKey: 'employee_id', as: 'payrolls' });
Payroll.belongsTo(Employee, { foreignKey: 'employee_id', as: 'employee' });

Company.hasMany(Payroll, { foreignKey: 'company_id', as: 'payrolls' });
Payroll.belongsTo(Company, { foreignKey: 'company_id', as: 'company' });

Employee.hasMany(SalaryRevision, { foreignKey: 'employee_id', as: 'salary_revisions' });
SalaryRevision.belongsTo(Employee, { foreignKey: 'employee_id', as: 'employee' });

SalaryRevision.belongsTo(Employee, { foreignKey: 'approved_by', as: 'approver' });

SalaryRevision.hasMany(Payroll, { foreignKey: 'salary_revision_id', as: 'payrolls' });
Payroll.belongsTo(SalaryRevision, { foreignKey: 'salary_revision_id', as: 'salary_revision' });

Company.hasMany(Document, { foreignKey: 'company_id', as: 'documents' });
Document.belongsTo(Company, { foreignKey: 'company_id', as: 'company' });

Employee.hasMany(Document, { foreignKey: 'employee_id', as: 'documents' });
Document.belongsTo(Employee, { foreignKey: 'employee_id', as: 'employee' });

Company.hasMany(Announcement, { foreignKey: 'company_id', as: 'announcements' });
Announcement.belongsTo(Company, { foreignKey: 'company_id', as: 'company' });

module.exports = db;
