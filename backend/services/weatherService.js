const axios = require("axios");

const WEATHER_API_KEY = process.env.WEATHER_API_KEY || "1cc6f90bac4547ad96d192422260803";

/**
 * Fetch REAL-TIME weather data from WeatherAPI
 * @param {string} location - Farmer's location
 * @returns {Promise<{temperature: number, humidity: number, source: string}>}
 */
const getRealTimeWeather = async (location) => {
  try {
    console.log(`🌍 Fetching REAL-TIME weather for: ${location}`);
    const response = await axios.get(`https://api.weatherapi.com/v1/current.json`, {
      params: {
        key: WEATHER_API_KEY,
        q: location,
        aqi: "no"
      },
      timeout: 5000
    });

    if (!response.data.current) {
      throw new Error("No weather data in response");
    }

    const { temp_c: temperature, humidity } = response.data.current;
    const realWeather = {
      temperature: parseFloat(temperature),
      humidity: parseFloat(humidity),
      source: "real-time",
      location: response.data.location.name,
      region: response.data.location.region,
      country: response.data.location.country,
      lastUpdated: new Date().toISOString()
    };

    console.log(`✅ REAL-TIME Weather: ${realWeather.temperature}°C, ${realWeather.humidity}% (${realWeather.location})`);
    return realWeather;
  } catch (error) {
    console.error(`❌ Failed to fetch real-time weather:`, error.message);
    throw error; // IMPORTANT: Throw error instead of silently falling back
  }
};

/**
 * Store weather data in database for future use
 * @param {number} farmerId - Farmer ID
 * @param {Object} weatherData - Weather data to store
 */
const storeWeatherInDatabase = (db, farmerId, weatherData) => {
  return new Promise((resolve, reject) => {
    const sql = `
      UPDATE farmers 
      SET lastFetchedTemperature = ?, 
          lastFetchedHumidity = ?,
          lastWeatherUpdate = ?
      WHERE id = ?
    `;
    
    db.run(
      sql,
      [
        weatherData.temperature,
        weatherData.humidity,
        weatherData.lastUpdated,
        farmerId
      ],
      (err) => {
        if (err) {
          console.warn(`⚠️  Could not store weather in DB:`, err.message);
          reject(err);
        } else {
          console.log(`📦 Weather stored in database for farmer ${farmerId}`);
          resolve();
        }
      }
    );
  });
};

/**
 * Get cached weather from database (if recent)
 * @param {Object} farmer - Farmer object with cached weather
 * @returns {Object|null} - Cached weather or null if too old
 */
const getCachedWeather = (farmer) => {
  if (!farmer.lastFetchedTemperature || !farmer.lastFetchedHumidity) {
    return null;
  }

  const lastUpdate = new Date(farmer.lastWeatherUpdate);
  const now = new Date();
  const ageInMinutes = (now - lastUpdate) / (1000 * 60);

  // Use cache if less than 30 minutes old
  if (ageInMinutes < 30) {
    console.log(`📦 Using cached weather (${Math.round(ageInMinutes)} minutes old)`);
    return {
      temperature: farmer.lastFetchedTemperature,
      humidity: farmer.lastFetchedHumidity,
      source: "cached",
      cachedAge: `${Math.round(ageInMinutes)}m`
    };
  }

  console.log(`⏰ Cached weather too old (${Math.round(ageInMinutes)} minutes), fetching fresh...`);
  return null;
};

module.exports = {
  getRealTimeWeather,
  storeWeatherInDatabase,
  getCachedWeather
};
