const multer = require('multer');
const multerS3 = require('multer-s3');
const { S3Client } = require('@aws-sdk/client-s3');
const path = require('path');
const dotenv = require("dotenv");

dotenv.config();

// Initialize AWS S3 Client (v3)
const s3 = new S3Client({
  region: process.env.CUSTOM_AWS_REGION,
  credentials: {
    accessKeyId: process.env.CUSTOM_AWS_ACCESS_KEY,
    secretAccessKey: process.env.CUSTOM_AWS_SECRET_KEY,
  },
});

// File filter to check allowed file types
const fileFilter = (req, file, cb) => {
  const fileTypes = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx/;
  const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = fileTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Only images, PDFs, DOC, DOCX, XLS, and XLSX files are allowed!'));
  }
};

// Configure Multer storage for Employee
const employeeStorage = multerS3({
  s3: s3,
  bucket: process.env.CUSTOM_AWS_BUCKET_NAME,
  acl: 'public-read',  // Set ACL to public-read
  key: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + file.originalname;
    console.log("Uploading file:", 'uploads/employee/' + file.fieldname + '-' + uniqueSuffix);
    cb(null, 'uploads/employee/' + file.fieldname + '-' + uniqueSuffix);
  }
});

// Configure Multer storage for Project
const projectStorage = multerS3({
  s3: s3,
  bucket: process.env.CUSTOM_AWS_BUCKET_NAME,
  key: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + file.originalname;
    cb(null, 'uploads/project/' + file.fieldname + '-' + uniqueSuffix);
  }
});

// Configure Multer storage for Task
const taskStorage = multerS3({
  s3: s3,
  bucket: process.env.CUSTOM_AWS_BUCKET_NAME,
  key: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + file.originalname;
    cb(null, 'uploads/task/' + file.fieldname + '-' + uniqueSuffix);
  }
});

// Configure Multer storage for Client
const clientStorage = multerS3({
  s3: s3,
  bucket: process.env.CUSTOM_AWS_BUCKET_NAME,
  key: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + file.originalname;
    cb(null, 'uploads/client/' + file.fieldname + '-' + uniqueSuffix);
  }
});
// Configure Multer storage for Message
const messageStorage = multerS3({
  s3: s3,
  bucket: process.env.CUSTOM_AWS_BUCKET_NAME,
  key: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + file.originalname;
    cb(null, 'uploads/message/' + file.fieldname + '-' + uniqueSuffix);
  }
});

// Create Multer instances for each type of file upload
const uploadEmployee = multer({ storage: employeeStorage, fileFilter: fileFilter });
const uploadProject = multer({ storage: projectStorage, fileFilter: fileFilter });
const uploadTask = multer({ storage: taskStorage, fileFilter: fileFilter });
const uploadClient = multer({ storage: clientStorage, fileFilter: fileFilter });
const uploadMessage = multer({ storage: messageStorage, fileFilter: fileFilter });


module.exports = { uploadEmployee, uploadProject, uploadTask, uploadClient, uploadMessage };