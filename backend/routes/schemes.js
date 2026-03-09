const express = require("express");
const router = express.Router();
const schemeController = require("../controllers/schemeController");

router.get("/live", schemeController.scrapeGovSchemes);

module.exports = router;