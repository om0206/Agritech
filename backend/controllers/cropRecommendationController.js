const db = require("../database/database");
const axios = require("axios");
const { spawn } = require("child_process");
const path = require("path");
const { getCropPrices } = require("../services/marketPriceService");
const { getRealTimeWeather, storeWeatherInDatabase, getCachedWeather } = require("../services/weatherService");

const WEATHER_API_KEY = process.env.WEATHER_API_KEY || "1cc6f90bac4547ad96d192422260803"; // Free WeatherAPI key (demo)

// HARDCODED FALLBACK REMOVED - We now use database caching for real-time weather instead!

/**
 * Fetch weather data - tries real-time API, then database cache
 * @param {string} location - Farmer's location
 * @param {Object} farmer - Farmer object for database cache fallback
 * @returns {Promise<{temperature: number, humidity: number, source: string}>}
 */
const fetchWeatherData = async (location, farmer) => {
  try {
    // 1. Try to fetch REAL-TIME weather from API
    const realWeather = await getRealTimeWeather(location);
    
    // 2. Store it in database for future cache
    try {
      await storeWeatherInDatabase(db, farmer.id, realWeather);
    } catch (err) {
      console.warn("Could not cache weather in database, but will continue with API data");
    }
    
    return realWeather;
  } catch (error) {
    console.warn(`⚠️  Real-time weather API failed: ${error.message}`);
    
    // 3. Fallback to cached weather from database (if recent)
    const cachedWeather = getCachedWeather(farmer);
    if (cachedWeather) {
      return cachedWeather;
    }
    
    // 4. If no cache available, throw error instead of using hardcoded values
    console.error(`❌ Cannot get weather data for recommendations!`);
    throw new Error(
      `Unable to fetch weather for location: ${location}. ` +
      `Make sure WeatherAPI is working and location is valid. ` +
      `Temperature: ${farmer.lastFetchedTemperature}, Humidity: ${farmer.lastFetchedHumidity}`
    );
  }
};

/**
 * Call Python script to predict crops
 * @param {number} temperature
 * @param {number} humidity
 * @param {string} soilType
 * @param {number} waterAvailability
 * @returns {Promise<Array>}
 */
const getPredictions = (temperature, humidity, soilType, waterAvailability) => {
  return new Promise((resolve, reject) => {
    const pythonScriptPath = path.join(__dirname, "../services/cropRecommendationService.py");
    
    console.log(`🔵 Calling Python script with: temp=${temperature}, humidity=${humidity}, soil=${soilType}, water=${waterAvailability}`);
    console.log(`📄 Script path: ${pythonScriptPath}`);
    
    // Spawn Python process
    const python = spawn("python", [
      pythonScriptPath,
      temperature.toString(),
      humidity.toString(),
      soilType,
      waterAvailability.toString()
    ]);

    let output = "";
    let errorOutput = "";

    python.stdout.on("data", (data) => {
      output += data.toString();
      console.log("📤 Python stdout:", data.toString());
    });

    python.stderr.on("data", (data) => {
      errorOutput += data.toString();
      console.log("⚠️  Python stderr:", data.toString());
    });

    python.on("close", (code) => {
      console.log(`🔴 Python process closed with code: ${code}`);
      console.log(`📝 Final output: ${output}`);
      
      if (code === 0) {
        try {
          const result = JSON.parse(output);
          console.log(`✅ Successfully parsed: ${JSON.stringify(result)}`);
          if (result.success) {
            resolve(result.recommendations);
          } else {
            console.error(`❌ Python returned error: ${result.error}`);
            reject(new Error(result.error || "Unknown error in Python script"));
          }
        } catch (e) {
          console.error(`❌ Failed to parse Python output: ${e.message}`);
          console.error(`Raw output was: ${output}`);
          reject(new Error(`Failed to parse Python output: ${e.message}`));
        }
      } else {
        console.error(`❌ Python script error code ${code}: ${errorOutput}`);
        reject(new Error(`Python script error (code ${code}): ${errorOutput || "Unknown error"}`));
      }
    });

    python.on("error", (err) => {
      console.error(`❌ Failed to spawn Python process: ${err.message}`);
      reject(new Error(`Failed to spawn Python process: ${err.message}`));
    });
  });
};

/**
 * Get crop recommendations for a specific farmer
 * GET /api/farmers/:id/crop-recommendations
 * Returns recommendations if crop not yet selected, or locked crop info if already selected
 */
exports.getCropRecommendations = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`\n📌 Getting recommendations for farmer ID: ${id}`);

    // 1. Get farmer data from database
    const farmerSql = "SELECT * FROM farmers WHERE id = ?";
    db.get(farmerSql, [id], async (err, farmer) => {
      if (err) {
        console.error(`❌ Database error: ${err.message}`);
        return res.status(500).json({ error: `Database error: ${err.message}` });
      }

      if (!farmer) {
        console.error(`❌ Farmer not found with ID: ${id}`);
        return res.status(404).json({ message: "Farmer not found" });
      }

      // Check if crop is already locked
      if (farmer.crop_locked === 1) {
        console.log(`🔒 Farmer ${farmer.username} has already selected crop: ${farmer.selected_crop}`);
        
        // Fetch market price for the locked crop
        const lockedCropPrices = await getCropPrices([farmer.selected_crop]);
        
        return res.json({
          success: true,
          isLocked: true,
          farmerId: farmer.id,
          farmerName: farmer.username,
          selectedCrop: farmer.selected_crop,
          selectedDate: farmer.crop_selected_date,
          marketPrice: lockedCropPrices[farmer.selected_crop],
          message: "Crop selection is locked. You cannot change it."
        });
      }

      console.log(`✅ Farmer found: ${farmer.username} at ${farmer.location}`);

      try {
        // 2. Fetch weather data using farmer's location (with real-time priority + database cache fallback)
        console.log(`🌤️  Fetching weather data for location: ${farmer.location}`);
        const weatherData = await fetchWeatherData(farmer.location, farmer);
        const { temperature, humidity, source } = weatherData;

        console.log(
          `🌡️  Weather data (${source}): temp=${temperature}°C, humidity=${humidity}%`
        );

        // 3. Get crop predictions (will be max 3)
        console.log(`🤖 Getting ML predictions...`);
        const recommendations = await getPredictions(
          temperature,
          humidity,
          farmer.soilDetails,
          farmer.waterAvailabilityMm
        );

        // Ensure exactly 3 recommendations
        const topThreeRecommendations = recommendations.slice(0, 3);

        // 5. Fetch market prices for the recommended crops
        console.log(`💰 Fetching market prices...`);
        const cropNames = topThreeRecommendations.map(rec => rec.crop);
        const cropPrices = await getCropPrices(cropNames);

        // 6. Enhance recommendations with market prices
        const recommendationsWithPrices = topThreeRecommendations.map((rec, index) => ({
          ...rec,
          marketPrice: cropPrices[rec.crop],
          priority: index + 1 // Priority based on ML recommendation rank
        }));

        // 7. Return recommendations with "Other" option
        console.log(`✅ Successfully returned ${recommendationsWithPrices.length} recommendations with prices`);
        res.json({
          success: true,
          isLocked: false,
          farmerId: farmer.id,
          farmerName: farmer.username,
          location: farmer.location,
          weather: {
            temperature: `${temperature}°C`,
            humidity: `${humidity}%`,
            source: source
          },
          farmConditions: {
            soilType: farmer.soilDetails,
            waterAvailability: `${farmer.waterAvailabilityMm}mm`
          },
          recommendations: recommendationsWithPrices,
          options: [
            ...recommendationsWithPrices,
            { crop: "Other", probability: 0, confidence: "Custom", isOther: true, marketPrice: null }
          ]
        });
      } catch (error) {
        console.error(`❌ Error during recommendation process: ${error.message}`);
        
        // If weather fetch failed, show clear error to user
        if (error.message.includes("Unable to fetch weather")) {
          return res.status(503).json({
            error: "Weather service temporarily unavailable",
            details: "Cannot fetch real-time weather data for crop recommendations. Please try again.",
            farmerId: id
          });
        }
        
        console.error(error);
        res.status(500).json({
          error: error.message || "Failed to get recommendations",
          farmerId: id,
          details: error.stack
        });
      }
    });
  } catch (error) {
    console.error(`❌ Unexpected error: ${error.message}`);
    console.error(error);
    res.status(500).json({ error: error.message || "Unexpected server error" });
  }
};

/**
 * Get crop recommendations for all farmers
 * GET /api/crop-recommendations/all
 */
exports.getAllFarmersRecommendations = async (req, res) => {
  try {
    const farmersSQL = "SELECT id, username, location, soilDetails, waterAvailabilityMm FROM farmers";

    db.all(farmersSQL, [], async (err, farmers) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (!farmers || farmers.length === 0) {
        return res.status(404).json({ message: "No farmers found" });
      }

      const allRecommendations = [];
      const errors = [];

      // Process each farmer
      for (const farmer of farmers) {
        try {
          console.log(`Processing farmer: ${farmer.username}`);
          const weatherData = await fetchWeatherData(farmer.location);
          const { temperature, humidity, source } = weatherData;

          const recommendations = await getPredictions(
            temperature,
            humidity,
            farmer.soilDetails,
            farmer.waterAvailabilityMm
          );

          // Ensure exactly 3 recommendations per farmer
          const topThreeRecommendations = recommendations.slice(0, 3);

          allRecommendations.push({
            farmerId: farmer.id,
            farmerName: farmer.username,
            location: farmer.location,
            weather: {
              temperature: `${temperature}°C`,
              humidity: `${humidity}%`,
              source: source
            },
            farmConditions: {
              soilType: farmer.soilDetails,
              waterAvailability: `${farmer.waterAvailabilityMm}mm`
            },
            recommendations: topThreeRecommendations
          });
        } catch (error) {
          errors.push({
            farmerId: farmer.id,
            farmerName: farmer.username,
            error: error.message
          });
        }
      }

      res.json({
        success: true,
        totalFarmers: farmers.length,
        processedFarmers: allRecommendations.length,
        recommendations: allRecommendations,
        errors: errors.length > 0 ? errors : undefined
      });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get crop recommendations with custom parameters
 * POST /api/crop-recommendations/predict
 */
exports.predictCrops = async (req, res) => {
  try {
    const { location, soilType, waterAvailability } = req.body;

    if (!location || !soilType || waterAvailability === undefined) {
      return res.status(400).json({
        error: "Missing required fields: location, soilType, waterAvailability"
      });
    }

    // Fetch weather data
    const weatherData = await fetchWeatherData(location);
    const { temperature, humidity, source } = weatherData;

    // Get predictions
    const recommendations = await getPredictions(
      temperature,
      humidity,
      soilType,
      parseFloat(waterAvailability)
    );

    // Ensure exactly 3 recommendations
    const topThreeRecommendations = recommendations.slice(0, 3);

    res.json({
      success: true,
      location,
      weather: {
        temperature: `${temperature}°C`,
        humidity: `${humidity}%`,
        source: source
      },
      farmConditions: {
        soilType,
        waterAvailability: `${waterAvailability}mm`
      },
      recommendations: topThreeRecommendations
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Save selected crop and lock it for a farmer
 * POST /api/farmers/:id/select-crop
 */
exports.selectAndLockCrop = async (req, res) => {
  try {
    const { id } = req.params;
    const { selectedCrop } = req.body;

    if (!selectedCrop || selectedCrop.trim() === "") {
      return res.status(400).json({ error: "Crop name is required" });
    }

    console.log(`\n🌾 Farmer ${id} selecting crop: ${selectedCrop}`);

    // Get farmer first to check existing lock
    const farmerSql = "SELECT * FROM farmers WHERE id = ?";
    db.get(farmerSql, [id], (err, farmer) => {
      if (err) {
        console.error(`❌ Database error: ${err.message}`);
        return res.status(500).json({ error: `Database error: ${err.message}` });
      }

      if (!farmer) {
        console.error(`❌ Farmer not found with ID: ${id}`);
        return res.status(404).json({ message: "Farmer not found" });
      }

      // Check if already locked
      if (farmer.crop_locked === 1) {
        console.warn(`⚠️  Farmer ${id} already has crop locked: ${farmer.selected_crop}`);
        return res.status(400).json({
          error: "Your crop selection is already locked and cannot be changed",
          currentCrop: farmer.selected_crop,
          selectedDate: farmer.crop_selected_date
        });
      }

      // Update farmer with selected crop and lock it
      const selectedDate = new Date().toISOString();
      const updateSql = "UPDATE farmers SET selected_crop = ?, crop_locked = 1, crop_selected_date = ? WHERE id = ?";
      
      db.run(updateSql, [selectedCrop, selectedDate, id], function(err) {
        if (err) {
          console.error(`❌ Error updating crop: ${err.message}`);
          return res.status(500).json({ error: `Error saving crop: ${err.message}` });
        }

        // 🔄 NEW: Create a crop journey entry when crop is locked
        const journeySql = `
          INSERT INTO crop_journey (farmer_id, crop_name, crop_sowing_date, crop_sowing_date_locked)
          VALUES (?, ?, NULL, 0)
        `;
        
        db.run(journeySql, [id, selectedCrop], function(journeyErr) {
          if (journeyErr) {
            console.warn(`⚠️ Warning: Could not create crop journey entry: ${journeyErr.message}`);
            // Don't fail the crop selection if journey creation fails
          } else {
            console.log(`✅ Crop journey created for farmer ${id}: ${selectedCrop} (journeyId: ${this.lastID})`);
          }
        });

        console.log(`✅ Crop locked for farmer ${id}: ${selectedCrop} (selected on ${selectedDate})`);
        res.json({
          success: true,
          message: "Crop selection confirmed and locked",
          farmerId: id,
          farmerName: farmer.username,
          selectedCrop: selectedCrop,
          selectedDate: selectedDate,
          isLocked: true
        });
      });
    });
  } catch (error) {
    console.error(`❌ Unexpected error: ${error.message}`);
    res.status(500).json({ error: error.message || "Unexpected server error" });
  }
};
