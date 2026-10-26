const mongoose = require("mongoose");
const TransportBooking = require("../models/TransportBooking");
const ProviderApplication = require("../models/ProviderApplication");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asyncHandler");
const typeToCategory = { auto: "Auto", car: "Passenger car", "goods-van": "Goods van" };

const create = asyncHandler(async (req, res) => {
  const { vehicleType, pickup, destination, scheduledAt, details = "" } = req.body;
  if (!Object.hasOwn(typeToCategory, vehicleType)) throw new ApiError(400, "Choose a valid vehicle type.");
  const cleanPickup = String(pickup || "").trim();
  const cleanDestination = String(destination || "").trim();
  const when = new Date(scheduledAt);
  if (cleanPickup.length < 2 || cleanPickup.length > 200 || cleanDestination.length < 2 || cleanDestination.length > 200) throw new ApiError(400, "Pickup and destination must each be between 2 and 200 characters.");
  if (!scheduledAt || !Number.isFinite(when.getTime()) || when < new Date(Date.now() - 60000)) throw new ApiError(400, "Choose a valid future date and time.");
  if (String(details).length > 1200) throw new ApiError(400, "Details must be 1200 characters or fewer.");
  const booking = await TransportBooking.create({ customerId: req.user.id, vehicleType, pickup: cleanPickup, destination: cleanDestination, scheduledAt: when, details: String(details).trim() });
  res.status(201).json(new ApiResponse(201, booking, "Transport request saved and made available to matching approved providers."));
});

const mine = asyncHandler(async (req, res) => {
  const items = await TransportBooking.find({ customerId: req.user.id }).populate("providerId", "name phone email").sort({ createdAt: -1 }).limit(100);
  res.json(new ApiResponse(200, items));
});

const available = asyncHandler(async (req, res) => {
  const application = await ProviderApplication.findOne({ userId: req.user.id, status: "approved" }).select("category");
  if (!application) throw new ApiError(403, "Only approved providers can view transport requests.");
  const vehicleType = Object.keys(typeToCategory).find((key) => typeToCategory[key] === application.category);
  if (!vehicleType) return res.json(new ApiResponse(200, []));
  const items = await TransportBooking.find({ vehicleType, status: "pending", declinedBy: { $ne: req.user.id }, $or: [{ providerId: null }, { providerId: req.user.id }] })
    .populate("customerId", "name phone location").sort({ scheduledAt: 1 }).limit(100);
  res.json(new ApiResponse(200, items));
});

const updateStatus = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw new ApiError(400, "Invalid booking ID.");
  const booking = await TransportBooking.findById(req.params.id);
  if (!booking) throw new ApiError(404, "Transport request not found.");
  const status = req.body.status;
  if (!["accepted", "rejected", "cancelled"].includes(status)) throw new ApiError(400, "Invalid booking status.");
  if (req.user.role === "provider") {
    const application = await ProviderApplication.findOne({ userId: req.user.id, status: "approved" }).select("category");
    if (!application || typeToCategory[booking.vehicleType] !== application.category) throw new ApiError(403, "You are not approved for this transport category.");
    if (booking.status !== "pending") throw new ApiError(409, "This request has already been processed.");
    if (status === "accepted") {
      booking.providerId = req.user.id;
      booking.status = "accepted";
    } else if (status === "rejected") {
      // A provider declining does not cancel the customer's request for other matching providers.
      if (!booking.declinedBy.some((id) => id.toString() === req.user.id)) booking.declinedBy.push(req.user.id);
      await booking.save();
      return res.json(new ApiResponse(200, { id: booking.id, status: booking.status }, "Request declined for your account; it remains available to other eligible providers."));
    }
  } else if (req.user.role === "customer" && booking.customerId.toString() === req.user.id && status === "cancelled" && booking.status === "pending") {
    booking.status = "cancelled";
  } else if (req.user.role === "admin") {
    booking.status = status;
    if (status === "accepted" && !booking.providerId) throw new ApiError(400, "Assign a provider before accepting this booking.");
  } else {
    throw new ApiError(403, "You cannot update this transport request.");
  }
  await booking.save();
  res.json(new ApiResponse(200, booking, "Transport request status updated."));
});

module.exports = { create, mine, available, updateStatus };
