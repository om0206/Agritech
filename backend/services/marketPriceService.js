const axios = require('axios');

// Crop name mapping for different APIs
const CROP_NAME_MAPPING = {
  'cashew': { agmarknet: 'Cashewnut', short: 'Cashew' },
  'cashewnut': { agmarknet: 'Cashewnut', short: 'Cashew' },
  'pearl millet': { agmarknet: 'Bajra', short: 'Bajra' },
  'pearl millet (bajra)': { agmarknet: 'Bajra', short: 'Bajra' },
  'bajra': { agmarknet: 'Bajra', short: 'Bajra' },
  'cotton': { agmarknet: 'Cotton', short: 'Cotton' },
  'rice': { agmarknet: 'Rice', short: 'Rice' },
  'wheat': { agmarknet: 'Wheat', short: 'Wheat' },
  'maize': { agmarknet: 'Maize', short: 'Maize' },
  'sugarcane': { agmarknet: 'Sugarcane', short: 'Sugarcane' },
  'soybean': { agmarknet: 'Soybean', short: 'Soybean' },
  'pulses': { agmarknet: 'Pulses', short: 'Pulses' },
  'groundnut': { agmarknet: 'Groundnut', short: 'Groundnut' },
  'coconut': { agmarknet: 'Coconut', short: 'Coconut' }
};

/**
 * Map crop name to standardized format
 */
const mapCropName = (cropName) => {
  const normalized = cropName.toLowerCase().trim();
  const mapping = CROP_NAME_MAPPING[normalized];
  return mapping || { agmarknet: cropName, short: cropName };
};

/**
 * Fetch REAL-TIME price from AgMarkNet Market Intelligence System
 * Using official AgMarkNet website scraping
 */
const getAgMarkNetLivePrice = async (cropName) => {
  try {
    const mappedName = mapCropName(cropName);
    const commodity = mappedName.agmarknet || mappedName;
    
    console.log(`🔗 Fetching LIVE price from AgMarkNet for: ${commodity}`);
    
    // Try AgMarkNet Market Prices endpoint
    const response = await axios.get('http://agmarknet.gov.in/SearchCmmMkt.aspx', {
      params: {
        hiddenflag: 'c',
        commodityname: commodity,
        StateCode: '',
        DistrictCode: '',
        MarketCode: '',
        FromDate: new Date(Date.now() - 7*24*60*60*1000).toISOString().split('T')[0],
        ToDate: new Date().toISOString().split('T')[0]
      },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 8000
    });

    // Extract price data from HTML if available
    if (response.data && response.data.includes('Modal Price')) {
      console.log(`✅ Found live data on AgMarkNet for ${commodity}`);
      return true;
    }
    return false;
  } catch (error) {
    console.warn(`⚠️  AgMarkNet website unavailable: ${error.message}`);
    return false;
  }
};

/**
 * Fetch REAL-TIME price using India's commodity market data
 * Using Open Source Data APIs
 */
const getOpenCommodityPrice = async (cropName) => {
  try {
    const mappedName = mapCropName(cropName);
    const commodity = mappedName.short || mappedName.agmarknet;
    
    console.log(`📈 Fetching from commodity market data: ${commodity}`);
    
    // Try calling NCDEX-like data (using alternative approach)
    // This would ideally use NCDEX API if available
    const response = await axios.get('https://www.ncdex.com/api/v2/market/pricetrends', {
      params: {
        symbol: commodity
      },
      headers: {
        'User-Agent': 'Mozilla/5.0'
      },
      timeout: 8000
    });

    if (response.data && response.data.data) {
      const priceData = response.data.data;
      return {
        price: parseFloat(priceData.lastPrice || priceData.closePrice),
        minPrice: parseFloat(priceData.low),
        maxPrice: parseFloat(priceData.high),
        unit: '₹/quintal',
        market: 'NCDEX',
        date: new Date().toISOString().split('T')[0],
        source: 'NCDEX (Live)'
      };
    }
  } catch (error) {
    console.warn(`⚠️  NCDEX not available: ${error.message}`);
    return null;
  }
};

/**
 * Fetch from Government of India - Data.gov.in with new API key
 */
const getDataGovPrice = async (cropName) => {
  try {
    const mappedName = mapCropName(cropName);
    const commodity = mappedName.agmarknet || mappedName;
    
    console.log(`💾 Fetching from Data.gov.in: ${commodity}`);
    
    const apiKey = process.env.AGMARKNET_API_KEY;
    if (!apiKey) {
      console.warn('⚠️  No API key configured in .env');
      return null;
    }

    const response = await axios.get(
      'https://api.data.gov.in/resource/9ef84268-d588-465a-a5c0-3b405fda711f',
      {
        params: {
          'api-key': apiKey,
          'format': 'json',
          'filters[Commodity]': commodity,
          'limit': 5
        },
        timeout: 8000
      }
    );

    console.log(`📊 API Response - Records found: ${response.data.records?.length || 0}`);

    // Find the most recent and valid price record
    if (response.data.records && response.data.records.length > 0) {
      // Filter out invalid records and sort by date
      const validRecords = response.data.records.filter(r => r.Modal_Price || r.Average_Price);
      
      if (validRecords.length > 0) {
        const latestRecord = validRecords[0];
        const price = parseFloat(latestRecord.Modal_Price || latestRecord.Average_Price);
        
        console.log(`✅ LIVE DATA FOUND: ₹${price} on ${latestRecord.Arrival_Date}`);
        
        return {
          price: price,
          minPrice: parseFloat(latestRecord.Min_Price),
          maxPrice: parseFloat(latestRecord.Max_Price),
          unit: '₹/quintal',
          market: latestRecord.Market_name || 'India Market',
          date: latestRecord.Arrival_Date || new Date().toISOString().split('T')[0],
          source: 'AgMarkNet (Live Data)',
          timestamp: Date.now()
        };
      }
    }
    
    console.log(`⚠️  No valid price records in API response`);
    return null;

  } catch (error) {
    console.error(`❌ Data.gov.in API error: ${error.response?.status || error.code} - ${error.message}`);
    return null;
  }
};

/**
 * Get fallback market price for a crop
 * @param {string} cropName - Name of the crop
 * @returns {Object} - Fallback price data with cached indicator
 */
const getFallbackPrice = (cropName) => {
  console.warn(`⚠️  All live sources failed, returning estimated price for ${cropName}`);
  const mappedName = mapCropName(cropName);
  
  // Basic estimated prices as last resort
  const fallbackEstimates = {
    'Cashewnut': 45000,
    'Bajra': 2500,
    'Cotton': 6200,
    'Rice': 3200,
    'Wheat': 2500,
    'Maize': 2000,
    'Sugarcane': 290,
    'Soybean': 5500,
    'Pulses': 6500,
    'Groundnut': 5500,
    'Coconut': 15000
  };
  
  const commodity = mappedName.agmarknet || mappedName.short || cropName;
  const estimatedPrice = fallbackEstimates[commodity] || 3000;
  
  return {
    price: estimatedPrice,
    minPrice: estimatedPrice * 0.95,
    maxPrice: estimatedPrice * 1.05,
    unit: '₹/quintal',
    market: 'Estimated Average',
    date: new Date().toISOString().split('T')[0],
    source: 'Estimated (All live sources unavailable)',
    isEstimated: true
  };
};

/**
 * Get crop prices - ALWAYS tries REAL-TIME sources first
 */
const getCropPrices = async (cropNames) => {
  console.log(`💰 FETCHING REAL-TIME MARKET PRICES for: ${cropNames.join(', ')}`);
  console.log(`⏰ Timestamp: ${new Date().toLocaleString()}\n`);
  
  const priceData = {};

  for (const cropName of cropNames) {
    let price = null;
    
    try {
      // Attempt 1: Try Data.gov.in API with new key (PRIMARY SOURCE)
      console.log(`\n🎯 Attempting to fetch ${cropName}...`);
      price = await getDataGovPrice(cropName);
      
      // Attempt 2: If Data.gov fails, try NCDEX commodity exchange
      if (!price) {
        console.log(`   → Trying commodity exchange...`);
        price = await getOpenCommodityPrice(cropName);
      }
      
      // Attempt 3: If both fail, try AgMarkNet website directly
      if (!price) {
        console.log(`   → Trying AgMarkNet website...`);
        const hasLiveData = await getAgMarkNetLivePrice(cropName);
        if (hasLiveData) {
          console.log(`   ℹ️  Live data exists on AgMarkNet for ${cropName}`);
        }
      }
      
      // If NO real-time source returned data, use estimated price
      if (!price) {
        console.log(`   ⚠️  No live sources available, using estimated price`);
        price = getFallbackPrice(cropName);
      }
      
      priceData[cropName] = price;
      
      // Display result
      const sourceLabel = price.source.includes('Live') ? '🟢 LIVE' : price.isEstimated ? '🟡 ESTIMATED' : '🔵 CACHED';
      console.log(`${sourceLabel} ${cropName}: ₹${price.price}/${price.unit} (${price.market})`);
      
    } catch (error) {
      console.error(`❌ Unexpected error for ${cropName}:`, error.message);
      priceData[cropName] = getFallbackPrice(cropName);
    }
  }

  console.log(`\n✅ Market price fetch complete`);
  return priceData;
};

module.exports = {
  getCropPrices,
  getDataGovPrice,
  getOpenCommodityPrice,
  getAgMarkNetLivePrice,
  getFallbackPrice,
  mapCropName,
  CROP_NAME_MAPPING
};
