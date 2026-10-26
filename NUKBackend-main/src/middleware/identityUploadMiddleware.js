const multer = require("multer");
const ApiError = require("../utils/ApiError");

const imageTypes = new Set(["image/jpeg", "image/png"]);
const allowedTypes = new Set(["image/jpeg", "image/png", "application/pdf"]);
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 7, fields: 30, parts: 40 },
  fileFilter: (_req, file, cb) => {
    if (file.fieldname === "aadhaarDocument") {
      if (!allowedTypes.has(file.mimetype)) return cb(new ApiError(400, "Upload the identity document as JPG, PNG, or PDF (max 5 MB)."));
    } else if (["profileImage", "vehicleImages"].includes(file.fieldname)) {
      if (!imageTypes.has(file.mimetype)) return cb(new ApiError(400, "Provider and vehicle photos must be JPG or PNG (max 5 MB each)."));
    } else {
      return cb(new ApiError(400, "Unexpected upload field."));
    }
    cb(null, true);
  }
});
function uploadProviderApplicationFiles(req, res, next) {
  upload.fields([
    { name: "aadhaarDocument", maxCount: 1 },
    { name: "profileImage", maxCount: 1 },
    { name: "vehicleImages", maxCount: 5 }
  ])(req, res, err => err ? next(err) : next());
}
module.exports = { uploadAadhaarDocument: uploadProviderApplicationFiles, uploadProviderApplicationFiles };
