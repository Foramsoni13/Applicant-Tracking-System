import multer from "multer";
import fs from "fs";
import path from "path";

// ==========================================
// CREATE uploads/resume FOLDER IF NOT EXISTS
// ==========================================

const uploadPath = path.join(process.cwd(), "uploads", "resume");

if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, {
    recursive: true,
  });
}

// ==========================================
// MULTER STORAGE
// ==========================================

const storage = multer.diskStorage({

  destination: function (req, file, cb) {
    cb(null, uploadPath);
  },

  filename: function (req, file, cb) {

    const uniqueName =
      Date.now() +
      "-" +
      file.originalname.replace(/\s+/g, "_");

    cb(null, uniqueName);
  },

});

// ==========================================
// FILE FILTER
// ==========================================

const fileFilter = (req, file, cb) => {

  const allowedTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];

  const fileName = file.originalname?.toLowerCase() || "";
  const isAllowedExtension =
    fileName.endsWith(".pdf") ||
    fileName.endsWith(".doc") ||
    fileName.endsWith(".docx");

  if (allowedTypes.includes(file.mimetype) && isAllowedExtension) {
    cb(null, true);
  } else {
    cb(new Error("Only PDF, DOC and DOCX files are allowed."));
  }
};

// ==========================================
// MULTER EXPORT
// ==========================================

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
  },
});

export default upload;