const axios = require('axios');

// AgMarkNet API - Get market prices for crops
// Documentation: https://agmarknet.gov.in/

/**
 * Fetch market price data for a crop from AgMarkNet API
 * @param {string} cropName - Name of the crop (e.g., "Rice", "Wheat")
 * @returns {Promise<{price: number, unit: string, market: string, date: string}>}
 */
const getAgMarkNetPrice = async (cropName) => {
  try {
    // AgMarkNet API endpoint for getting commodity prices
    const apiKey = process.env.AGMARKNET_API_KEY;
    
    const response = await axios.get(`https://api.data.gov.in/resource/9ef84268-d588-465a-a5c0-3b405fda711f`, {
      params: {
        'api-key': apiKey || '', // Use API key from .env
        'format': 'json',
        'filters[Commodity]': cropName,
        'limit': 1,
        'sort[0][name]': 'Arrival_Date',
        'sort[0][direction]': 'desc'
      },
      timeout: 5000
    });

    if (response.data.records && response.data.records.length > 0) {
      const record = response.data.records[0];
      return {
        price: parseFloat(record.Modal_Price) || parseFloat(record.Average_Price),
        minPrice: parseFloat(record.Min_Price),
        maxPrice: parseFloat(record.Max_Price),
        unit: '₹/quintal',
        market: record.Market_name || 'India Market',
        date: record.Arrival_Date || new Date().toISOString().split('T')[0],
        source: 'AgMarkNet'
      };
    }
    return null;
  } catch (error) {
    console.warn(`⚠️  AgMarkNet API error for ${cropName}:`, error.message);
    return null;
  }
};

/**
 * Get price data for multiple crops
 * @param {Array<string>} cropNames - Array of crop names
 * @returns {Promise<Object>} - Object with crop names as keys and price data as values
 */
const getCropPricesFromAgMarkNet = async (cropNames) => {
  const priceData = {};

  for (const cropName of cropNames) {
    const price = await getAgMarkNetPrice(cropName);
    priceData[cropName] = price;
  }

  return priceData;
};

/**
 * Minimal fallback price if both API and cache fail
 * This is ONLY used as last resort - farmers should get AgMarkNet prices
 */
const MINIMAL_FALLBACK_PRICE = {
  price: null,
  unit: '₹/quintal',
  market: 'Price unavailable',
  source: 'unavailable',
  note: 'Please check AgMarkNet website directly'
};

/**
 * Get crop prices - ALWAYS tries AgMarkNet API first
 * @param {Array<string>} cropNames - Array of crop names
 * @returns {Promise<Object>} - Real AgMarkNet prices
 */
const getCropPrices = async (cropNames) => {
  console.log(`💰 Fetching REAL market prices from AgMarkNet for: ${cropNames.join(', ')}`);

  const priceData = {};

  for (const cropName of cropNames) {
    // PRIMARY: Try AgMarkNet API (REAL prices)
    let price = await getAgMarkNetPrice(cropName);

    // FALLBACK: Only if API fails
    if (!price) {
      console.warn(`❌ Could not fetch AgMarkNet price for ${cropName}`);
      price = MINIMAL_FALLBACK_PRICE;
    } else {
      console.log(`✅ AgMarkNet price for ${cropName}: ₹${price.price}/${price.unit}`);
    }

    priceData[cropName] = price;
  }

  return priceData;
};

module.exports = {
  getCropPrices,
  getAgMarkNetPrice,
  getCropPricesFromAgMarkNet
};
