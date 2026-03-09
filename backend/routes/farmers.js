const express = require("express");
const router = express.Router();
const farmerController = require("../controllers/farmerController");
const cropRecommendationController = require("../controllers/cropRecommendationController");

console.log("📍 Loading farmer routes...");

// Test route - super simple
router.post("/:id/select-crop", cropRecommendationController.selectAndLockCrop);

// Other routes
router.get("/:id/crop-recommendations", cropRecommendationController.getCropRecommendations);
router.post("/recommendations/predict", cropRecommendationController.predictCrops);
router.get("/recommendations/all", cropRecommendationController.getAllFarmersRecommendations);
router.get("/options/water-availability", farmerController.getWaterAvailabilityOptions);

// POST routes before GET
router.post("/signup", farmerController.signup);
router.post("/login", farmerController.login);
router.put("/update/:id", farmerController.updateProfile);

// Sowing date routes
router.post("/:id/sowing-date", farmerController.saveSowingDate);
router.get("/:id/sowing-date", farmerController.getSowingDate);

// FINAL: Catch-all /:id route
router.get("/:id", farmerController.getProfile);

module.exports = router;
