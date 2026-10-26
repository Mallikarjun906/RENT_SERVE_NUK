const mongoose = require("mongoose");
const schema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
  fullName: { type: String, required: true, trim: true, maxlength: 100 },
  phone: { type: String, required: true, trim: true, maxlength: 25 },
  // Date of birth is collected by the provider application form and retained for age-eligibility review.
  dob: { type: Date, required: true, index: true },
  address: { type: String, trim: true, maxlength: 300, default: "" },
  serviceArea: { type: String, trim: true, maxlength: 200, default: "" },
  email: { type: String, trim: true, lowercase: true, maxlength: 254, default: "" },
  city: { type: String, required: true, trim: true, minlength: 2, maxlength: 100, index: true },
  taluk: { type: String, required: true, trim: true, minlength: 2, maxlength: 100, index: true },
  district: { type: String, required: true, trim: true, minlength: 2, maxlength: 100, index: true },
  profileImage: { url: { type: String, required: true }, publicId: { type: String, required: true } },
  vehicleImages: [{ url: { type: String, required: true }, publicId: { type: String, required: true } }],
  category: { type: String, required: true, trim: true, maxlength: 80 },
  experience: { type: String, trim: true, maxlength: 80, default: "" },
  price: { type: String, trim: true, maxlength: 100, default: "" },
  description: { type: String, required: true, trim: true, maxlength: 3000 },
  consent: { type: Boolean, required: true, default: false },
  aadhaarDocument: { publicId: { type: String, default: "" }, resourceType: { type: String, enum: ["image", "raw", ""], default: "" }, mimeType: { type: String, enum: ["image/jpeg", "image/png", "application/pdf", ""], default: "" }, uploadedAt: { type: Date, default: null } },
  status: { type: String, enum: ["pending", "info", "approved", "rejected"], default: "pending", index: true },
  reviewNote: { type: String, trim: true, maxlength: 500, default: "" },
  identityReviewStatus: { type: String, enum: ["not_checked", "match", "possible_mismatch", "manual_review_required"], default: "not_checked" },
  aadhaarName: { type: String, trim: true, maxlength: 100, default: "" },
  identityReviewNote: { type: String, trim: true, maxlength: 500, default: "" },
  identityReviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  identityReviewedAt: { type: Date, default: null }
}, { timestamps: true });
schema.pre("validate", function(next) {
  const driverCategories = ["Auto", "Passenger car", "Goods van"];
  if (driverCategories.includes(this.category) && (!Array.isArray(this.vehicleImages) || this.vehicleImages.length < 1)) {
    this.invalidate("vehicleImages", "At least one vehicle photo is required for driver applications.");
  }
  if (Array.isArray(this.vehicleImages) && this.vehicleImages.length > 5) {
    this.invalidate("vehicleImages", "Maximum five vehicle photos are allowed.");
  }
  next();
});
module.exports = mongoose.model("ProviderApplication", schema);
