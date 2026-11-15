const express=require('express');
const router=express.Router();
const companyAuthMiddleware=require('../middlewares/companyAuthMiddleware');
const companyController=require('../controllers/companyController');
const masterController=require('../controllers/masterController');
const {upload}=require('../middlewares/multer');
router.post("/login", companyController.companyLogin);
router.post('/forget-password', companyController.forgetCompanyPassword);
router.post('/verify-reset-otp', companyController.verifyCompanyResetOtp);
router.post('/reset-password', companyController.resetCompanyPassword);
router.post("/create-employee", companyAuthMiddleware, upload.single('profile_pic'), companyController.createEmployee);
router.get("/get-employees", companyAuthMiddleware, companyController.getEmployees);
router.put("/employee/:id", companyAuthMiddleware, upload.single('profile_pic'), companyController.updateEmployee);
router.patch("/employee/:id/status", companyAuthMiddleware, companyController.updateEmployeeStatus);
router.delete("/employee/:id", companyAuthMiddleware, companyController.deleteEmployee);
router.get(
  "/employee-dropdown", 
  companyAuthMiddleware, 
  companyController.getEmployeeForDropdown
);
router.post("/create-payroll", companyAuthMiddleware, companyController.createPayroll);
router.put("/payroll/:id", companyAuthMiddleware, companyController.updatePayroll);
router.get(
  "/payrolls", 
  companyAuthMiddleware, 
  companyController.getAllPayrolls
);

router.get(
  "/payroll/:id", 
  companyAuthMiddleware, 
  companyController.getPayrollById
);

router.get(
  "/salary-slips", 
  companyAuthMiddleware, 
  companyController.getSalarySlipListing
);

router.get(
  "/salary-slip/:id/view", 
  companyAuthMiddleware, 
  companyController.getSalarySlipView
);
router.patch("/payroll/:id/status", companyAuthMiddleware, companyController.updatePayrollStatus);
router.delete("/payroll/:id", companyAuthMiddleware, companyController.deletePayroll);
router.get("/get-employee/:id", companyAuthMiddleware, companyController.getEmployeeById);
router.get("/employee/:id/salary", companyAuthMiddleware, companyController.getCompanyEmployeeSalaryForPeriod);
router.get("/employee/:id/salary-revisions", companyAuthMiddleware, companyController.getCompanyEmployeeSalaryRevisions);
router.post("/employee/:id/salary-revisions", companyAuthMiddleware, companyController.createCompanyEmployeeSalaryRevision);
router.get('/payroll/:id/download', companyAuthMiddleware, companyController.downloadSalarySlip);
router.get('/masters', companyAuthMiddleware, masterController.listCompanyMasters);
router.get('/salary-revisions', companyAuthMiddleware, companyController.getCompanySalaryRevisionListing);
module.exports=router;
