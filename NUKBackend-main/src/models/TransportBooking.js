const mongoose = require("mongoose");
const schema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  providerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
  vehicleType: { type: String, enum: ["auto", "car", "goods-van"], required: true, index: true },
  pickup: { type: String, required: true, trim: true, minlength: 2, maxlength: 200 },
  destination: { type: String, required: true, trim: true, minlength: 2, maxlength: 200 },
  scheduledAt: { type: Date, required: true, index: true },
  details: { type: String, trim: true, maxlength: 1200, default: "" },
  status: { type: String, enum: ["pending", "accepted", "rejected", "cancelled"], default: "pending", index: true },
  providerNote: { type: String, trim: true, maxlength: 500, default: "" },
  declinedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }]
}, { timestamps: true });
schema.index({ vehicleType: 1, status: 1, scheduledAt: 1 });
module.exports = mongoose.model("TransportBooking", schema);
