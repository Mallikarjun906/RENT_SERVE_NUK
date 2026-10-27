const router = require("express").Router();
const applicationController = require("../controllers/providerApplicationController");
const { uploadAadhaarDocument } = require("../middleware/identityUploadMiddleware");
router.post("/register", uploadAadhaarDocument, applicationController.submit);
const controller = require("../controllers/providerController");
const { authenticate } = require("../middleware/authMiddleware");
const { allowRoles } = require("../middleware/roleMiddleware");

router.get("/public", controller.listPublicProfiles);
router.get("/nearby", controller.getNearbyProfiles);
router.get("/me", authenticate, allowRoles("provider"), controller.getMyProviderProfile);
router.patch("/me", authenticate, allowRoles("provider"), controller.updateMyProviderProfile);
router.get("/:id", controller.getPublicProfile);

module.exports = router;
