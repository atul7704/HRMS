const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/jpg',
  'image/webp',
  'application/pdf', 
];


const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = 'uploads/misc';

    if (file.fieldname === 'logo') folder = 'uploads/companies';
    else if (file.fieldname === 'profile_pic') folder = 'uploads/employees';
    else if (file.fieldname === 'document') folder = 'uploads/employees/docs';

    ensureDir(folder);
    cb(null, folder);
  },
  filename: (req, file, cb) => {
    const uniqueName =
      Date.now() +
      '-' +
      crypto.randomBytes(6).toString('hex') +
      path.extname(file.originalname).toLowerCase();
    cb(null, uniqueName);
  },
});

const fileFilter = (req, file, cb) => {
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return cb(
      new Error(
        `Invalid file type: ${file.mimetype}. Only JPEG, PNG, WEBP, PDF allowed.`
      ),
      false
    );
  }
  cb(null, true);
};

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter,
});


const uploadCompanyLogo = upload.single('logo');


const uploadEmployeeProfile = upload.single('profile_pic');

const uploadEmployeeFull = upload.fields([
  { name: 'profile_pic', maxCount: 1 },
  { name: 'document', maxCount: 5 },
]);

const uploadSingle = (fieldName) => upload.single(fieldName);

module.exports = {
  upload,
  uploadCompanyLogo,
  uploadEmployeeProfile,
  uploadEmployeeFull,
  uploadSingle,
  MAX_FILE_SIZE,
};