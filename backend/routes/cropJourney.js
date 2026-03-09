const express = require("express");
const router = express.Router();
const cropJourneyController = require("../controllers/cropJourneyController");

// Save a new crop journey entry
router.post("/:id/journey", cropJourneyController.saveCropJourney);

// Get all crop journey history for a farmer
router.get("/:id/journey/history", cropJourneyController.getCropJourney);

// Get current (latest) crop journey for a farmer
router.get("/:id/journey/current", cropJourneyController.getCurrentCropJourney);

// Update sowing date for current crop journey
router.put("/:id/journey/sowing-date", cropJourneyController.updateCropJourneySowingDate);

// Delete a crop journey entry
router.delete("/:id/journey/:journeyId", cropJourneyController.deleteCropJourney);

module.exports = router;
