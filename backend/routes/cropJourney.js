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

// ============ Water & Fertilizer Logs ============

// Add water log for a journey
router.post("/:id/journey/:journeyId/water-log", cropJourneyController.addWaterLog);

// Add fertilizer log for a journey
router.post("/:id/journey/:journeyId/fertilizer-log", cropJourneyController.addFertilizerLog);

// Get all logs for a journey
router.get("/:id/journey/:journeyId/logs", cropJourneyController.getCropJourneyLogs);

// ============ Notifications ============

// Create a notification reminder
router.post("/:id/journey/:journeyId/notification", cropJourneyController.createNotification);

// Get pending notifications for farmer
router.get("/:id/notifications/pending", cropJourneyController.getPendingNotifications);

// Mark notification as sent
router.put("/:id/notification/:notificationId/sent", cropJourneyController.markNotificationAsSent);

// ============ Complete Journey Data ============

// Get complete journey with all logs and notifications
router.get("/:id/journey/:journeyId/complete", cropJourneyController.getCompleteJourneyWithLogs);

// ============ AI Crop Care Planning (Groq) ============

// Generate intelligent crop care plan using Groq AI
router.post("/:id/journey/:journeyId/generate-plan", cropJourneyController.generateCropCarePlan);

// Get crop care schedule (planned watering and fertilizer)
router.get("/:id/journey/:journeyId/care-schedule", cropJourneyController.getCropCareSchedule);

// Mark a scheduled task as completed
router.put("/:id/care-schedule/:taskId/complete", cropJourneyController.markTaskCompleted);

// Mark a scheduled task as skipped
router.put("/:id/care-schedule/:taskId/skip", cropJourneyController.skipTask);

module.exports = router;
