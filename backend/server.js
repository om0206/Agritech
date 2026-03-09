const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
require("dotenv").config();

// Import routes
const farmerRoutes = require("./routes/farmers");
const schemeRoutes = require("./routes/schemes");
const cropJourneyRoutes = require("./routes/cropJourney");

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Log all routes before applying them
console.log("\n📋 Farmer routes before app.use:");
farmerRoutes.stack.forEach((layer, i) => {
  if (layer.route) {
    const methods = Object.keys(layer.route.methods).map(m => m.toUpperCase()).join(',');
    console.log(`  [${i}] ${methods} ${layer.route.path}`);
  }
});

// Apply routes
app.use("/farmers", farmerRoutes);
app.use("/schemes", schemeRoutes);
app.use("/farmers", cropJourneyRoutes);

const PORT = process.env.PORT || 5000;

// Listen on all interfaces
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n✅ Server running on http://0.0.0.0:${PORT}`);
  console.log(`✅ Test at: http://localhost:${PORT}/farmers/1/select-crop`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});

// Log any connection errors
server.on('error', (err) => {
  console.error('❌ Server error:', err);
});