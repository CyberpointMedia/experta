const multer = require("multer");
const path = require("path");
const util = require("util");
const { S3Client } = require("@aws-sdk/client-s3");

const multerS3 = require("multer-s3");

const s3 = new S3Client({
  credentials: {
    secretAccessKey: process.env.AWS_IAM_USER_SECRET,
    accessKeyId: process.env.AWS_IAM_USER_KEY,
  },
  region: process.env.AWS_REGION,
});

const storage = multerS3({
  s3: s3,
  bucket: process.env.AWS_BUCKET_NAME,
  contentType: multerS3.AUTO_CONTENT_TYPE,
  metadata: function (req, file, cb) {
    cb(null, { fieldName: file.fieldname });
  },
  key: function (req, file, cb) {
    cb(null, Date.now().toString());
  },
});

function checkFileType(file, cb) {
  const filetypes = /jpeg|jpg|png|gif|mp4|mov|pdf|ico|png/;

  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

  const mimetype = filetypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb("Error: Images only (jpeg, jpg, png, gif, mp4, mov, png,ico)!");
  }
}

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
});

const uploadMiddleWare = upload;

module.exports = uploadMiddleWare;
