const ServiceProvider = require("../models/ServiceProvider");
const ServiceListing = require("../models/ServiceListing");
const ServiceCategory = require("../models/ServiceCategory");
const User = require("../models/User");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asyncHandler");

const publicProfileShape = (profile) => {
  const user = profile.userId || {};
  const photo = profile.profileImage?.url || user.photoUrl || "";
  return {
    ...profile.toObject ? profile.toObject() : profile,
    id: profile._id?.toString ? profile._id.toString() : profile.id,
    userId: user && user._id ? {
      ...user.toObject ? user.toObject() : user,
      id: user._id?.toString ? user._id.toString() : user.id,
      photoUrl: user.photoUrl || ""
    } : user,
    profileImage: profile.profileImage || { url: photo, publicId: "" },
    photoUrl: photo,
    displayName: profile.displayName || user.name || "Provider",
    verificationStatus: profile.verificationStatus || "unverified"
  };
};

const listPublicProfiles = asyncHandler(async (req, res) => {
  const search = String(req.query.search || "").trim();
  const city = String(req.query.city || "").trim();
  const category = String(req.query.category || "").trim();
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(20, Math.max(1, Number(req.query.limit) || 12));

  const filter = { verificationStatus: "verified" };
  if (search) {
    const pattern = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$or = [
      { displayName: pattern },
      { bio: pattern },
      { skills: { $in: [pattern] } }
    ];
  }

  const [profiles, total] = await Promise.all([
    ServiceProvider.find(filter)
      .populate("userId", "name email location photoUrl")
      .sort({ updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    ServiceProvider.countDocuments(filter)
  ]);

  const items = profiles
    .filter((profile) => {
      const user = profile.userId || {};
      if (city && !String(user.location || "").toLowerCase().includes(city.toLowerCase())) return false;
      if (category) {
        const categoryPattern = new RegExp(category.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
        const matchesCategory = (profile.skills || []).some((skill) => categoryPattern.test(String(skill))) || categoryPattern.test(String(profile.bio || ""));
        if (!matchesCategory) return false;
      }
      return true;
    })
    .map(publicProfileShape);

  res.json(new ApiResponse(200, {
    items,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) }
  }));
});

const getPublicProfile = asyncHandler(async (req, res) => {
  const profile = await ServiceProvider.findById(req.params.id).populate("userId", "name email location photoUrl");
  if (!profile) throw new ApiError(404, "Provider profile not found.");
  if (profile.verificationStatus !== "verified") throw new ApiError(404, "This provider profile is not public yet.");

  const listings = await ServiceListing.find({ providerId: profile.userId?._id, status: "published" })
    .populate("categoryId", "name slug")
    .sort({ createdAt: -1 })
    .limit(10);

  const payload = {
    ...publicProfileShape(profile),
    services: listings.map((item) => ({
      id: item._id,
      title: item.title,
      description: item.description,
      location: item.location,
      category: item.categoryId?.name || "Service",
      price: item.priceRange ? `₹${item.priceRange.min}${item.priceRange.max && item.priceRange.max !== item.priceRange.min ? `–₹${item.priceRange.max}` : ''}` : "Contact for price"
    })),
    customerRating: null,
    reviewCount: 0,
    available: true
  };

  res.json(new ApiResponse(200, payload));
});

const getNearbyProfiles = asyncHandler(async (req, res) => {
  const city = String(req.query.city || "").trim();
  const category = String(req.query.category || "").trim();
  const latitude = Number(req.query.latitude);
  const longitude = Number(req.query.longitude);
  const radiusKm = Math.max(1, Number(req.query.radiusKm) || 25);

  const filter = { verificationStatus: "verified" };
  if (city) {
    const userIds = await User.find({ role: "provider", location: { $regex: city, $options: "i" } }).select("_id");
    filter.userId = { $in: userIds.map((user) => user._id) };
  }

  const profiles = await ServiceProvider.find(filter)
    .populate("userId", "name email location photoUrl")
    .sort({ updatedAt: -1 });

  const items = profiles
    .filter((profile) => {
      const user = profile.userId || {};
      if (category) {
        const categoryPattern = new RegExp(category.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
        const matches = (profile.skills || []).some((skill) => categoryPattern.test(String(skill))) || categoryPattern.test(String(profile.bio || ""));
        if (!matches) return false;
      }
      return true;
    })
    .map((profile) => {
      const row = publicProfileShape(profile);
      const distanceKm = Number.isFinite(latitude) && Number.isFinite(longitude) && radiusKm ? `${radiusKm} km approx.` : null;
      return { ...row, distanceKm, locationLabel: row.userId?.location || row.location || "Karnataka" };
    });

  res.json(new ApiResponse(200, { items, radiusKm, hasLocation: Number.isFinite(latitude) && Number.isFinite(longitude) }));
});

const getMyProviderProfile = asyncHandler(async (req, res) => {
  const profile = await ServiceProvider.findOne({ userId: req.user.id }).populate("userId", "name email location photoUrl");
  if (!profile) throw new ApiError(404, "Provider profile not found.");
  res.json(new ApiResponse(200, profile));
});

const updateMyProviderProfile = asyncHandler(async (req, res) => {
  const allowed = ["displayName", "bio", "skills", "experienceYears", "profileImage"];
  const updates = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) {
      if (key === "profileImage" && req.body.profileImage && typeof req.body.profileImage === "object") {
        updates.profileImage = {
          url: req.body.profileImage.url || "",
          publicId: req.body.profileImage.publicId || ""
        };
      } else {
        updates[key] = req.body[key];
      }
    }
  }
  const profile = await ServiceProvider.findOneAndUpdate(
    { userId: req.user.id }, { $set: updates }, { new: true, runValidators: true, upsert: true, setDefaultsOnInsert: true }
  );
  res.json(new ApiResponse(200, profile, "Provider profile updated."));
});

module.exports = { getMyProviderProfile, updateMyProviderProfile, listPublicProfiles, getPublicProfile, getNearbyProfiles };
