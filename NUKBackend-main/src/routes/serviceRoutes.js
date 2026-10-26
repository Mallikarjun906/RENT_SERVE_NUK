const router = require("express").Router();
const controller = require("../controllers/serviceController");
const { authenticate } = require("../middleware/authMiddleware");
const { allowRoles } = require("../middleware/roleMiddleware");
const { uploadListingImages } = require("../middleware/uploadMiddleware");

router.get("/", controller.listServices);
router.get("/:id", controller.getService);
router.post("/", authenticate, allowRoles("admin"), uploadListingImages, controller.createService);
router.patch("/:id", authenticate, allowRoles("admin"), uploadListingImages, controller.updateService);
router.delete("/:id", authenticate, allowRoles("admin"), controller.deleteService);
router.delete("/:id/images/:imageId", authenticate, allowRoles("admin"), controller.deleteServiceImage);

module.exports = router;
