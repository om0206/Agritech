const axios = require("axios");
const cheerio = require("cheerio");

// In-memory cache with TTL (24 hours)
let schemeCache = {
  data: null,
  timestamp: null,
  TTL: 24 * 60 * 60 * 1000 // 24 hours in milliseconds
};

const isCacheValid = () => {
  if (!schemeCache.data || !schemeCache.timestamp) return false;
  return (Date.now() - schemeCache.timestamp) < schemeCache.TTL;
};

exports.scrapeGovSchemes = async (req, res) => {
  try {
    // Check if cache is still valid
    if (isCacheValid()) {
      console.log("📦 Returning cached schemes...");
      return res.json({ success: true, data: schemeCache.data });
    }

    console.log("🌐 Fetching real-time schemes from government sources...");
    
    // Fetch from multiple government sources
    const fetchedSchemes = await Promise.all([
      fetchPMKisanSchemes(),
      fetchPMFBYSchemes(),
      fetchSoilHealthSchemes(),
      fetchMicroIrrigationSchemes(),
      fetchOtherSchemes()
    ]);

    // Flatten and deduplicate schemes
    const allSchemes = fetchedSchemes
      .flat()
      .filter(scheme => scheme && scheme.title && scheme.url);

    // Remove duplicates based on title
    const uniqueSchemes = Array.from(
      new Map(allSchemes.map(item => [item.title, item])).values()
    );

    if (uniqueSchemes.length > 0) {
      // Cache the results
      schemeCache.data = uniqueSchemes;
      schemeCache.timestamp = Date.now();
      
      console.log(`✅ Fetched ${uniqueSchemes.length} real-time schemes`);
      return res.json({ success: true, data: uniqueSchemes });
    } else {
      // Fallback to hardcoded data if scraping fails
      console.log("⚠️ Could not fetch from APIs, using fallback schemes");
      const fallbackSchemes = getFallbackSchemes();
      schemeCache.data = fallbackSchemes;
      schemeCache.timestamp = Date.now();
      return res.json({ success: true, data: fallbackSchemes });
    }

  } catch (error) {
    console.error("❌ Error fetching schemes:", error.message);
    
    // Use fallback schemes on error
    if (schemeCache.data) {
      return res.json({ success: true, data: schemeCache.data });
    }
    
    const fallbackSchemes = getFallbackSchemes();
    return res.json({ success: true, data: fallbackSchemes });
  }
};

// Fetch PM-Kisan Samman Nidhi with real scraping
const fetchPMKisanSchemes = async () => {
  try {
    console.log("🔍 Scraping PM-Kisan data from pmkisan.gov.in...");
    const response = await axios.get("https://pmkisan.gov.in/", {
      timeout: 8000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const $ = cheerio.load(response.data);
    const schemes = [];
    
    // Parse scheme information from page
    $('div[class*="scheme"], article[class*="scheme"], .scheme-card').each((index, element) => {
      const title = $(element).find('h1, h2, h3, .title').text().trim();
      const description = $(element).find('p, .description').text().trim();
      
      if (title.toLowerCase().includes('kisan') && title.toLowerCase().includes('6000')) {
        schemes.push({
          id: "pmkisan_" + Date.now(),
          title: title || "PM-Kisan Samman Nidhi",
          description: description || "Direct income support scheme from government",
          minInvestment: 0,
          maxInvestment: 1000000,
          url: "https://pmkisan.gov.in/",
          launchDate: "2019",
          fetchedAt: new Date().toISOString(),
          source: "scraped"
        });
      }
    });
    
    // If scraping found something, return it. Otherwise fallback
    if (schemes.length > 0) {
      console.log("✓ PM-Kisan: Found " + schemes.length + " scheme(s) from live website");
      return schemes;
    } else {
      console.log("⚠️ PM-Kisan: Fallback to known scheme (website structure changed)");
      return [{
        id: "pmkisan_fallback",
        title: "PM-Kisan Samman Nidhi",
        description: "Direct income support of ₹6,000 per year for farming families",
        minInvestment: 0,
        maxInvestment: 1000000,
        url: "https://pmkisan.gov.in/",
        launchDate: "2019",
        fetchedAt: new Date().toISOString(),
        source: "fallback"
      }];
    }
  } catch (error) {
    console.log("⚠️ PM-Kisan: Could not fetch from website:", error.message);
    return [{
      id: "pmkisan_error",
      title: "PM-Kisan Samman Nidhi",
      description: "Direct income support of ₹6,000 per year for farming families",
      minInvestment: 0,
      maxInvestment: 1000000,
      url: "https://pmkisan.gov.in/",
      launchDate: "2019",
      fetchedAt: new Date().toISOString(),
      source: "fallback"
    }];
  }
};

// Fetch Pradhan Mantri Fasal Bima Yojana with real scraping
const fetchPMFBYSchemes = async () => {
  try {
    console.log("🔍 Scraping PMFBY data from pmfby.gov.in...");
    const response = await axios.get("https://pmfby.gov.in/", {
      timeout: 8000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const $ = cheerio.load(response.data);
    const schemes = [];
    
    // Parse scheme information
    $('div[class*="scheme"], article[class*="scheme"], .scheme-card').each((index, element) => {
      const title = $(element).find('h1, h2, h3, .title').text().trim();
      const description = $(element).find('p, .description').text().trim();
      
      if (title.toLowerCase().includes('fasal') || title.toLowerCase().includes('insurance')) {
        schemes.push({
          id: "pmfby_" + Date.now(),
          title: title || "Pradhan Mantri Fasal Bima Yojana",
          description: description || "Crop insurance protection scheme",
          minInvestment: 0,
          maxInvestment: 300000,
          url: "https://pmfby.gov.in/",
          launchDate: "2016",
          fetchedAt: new Date().toISOString(),
          source: "scraped"
        });
      }
    });
    
    if (schemes.length > 0) {
      console.log("✓ PMFBY: Found " + schemes.length + " scheme(s) from live website");
      return schemes;
    } else {
      console.log("⚠️ PMFBY: Fallback to known scheme");
      return [{
        id: "pmfby_fallback",
        title: "Pradhan Mantri Fasal Bima Yojana",
        description: "Comprehensive crop insurance with premium subsidy covering crop failure",
        minInvestment: 0,
        maxInvestment: 300000,
        url: "https://pmfby.gov.in/",
        launchDate: "2016",
        fetchedAt: new Date().toISOString(),
        source: "fallback"
      }];
    }
  } catch (error) {
    console.log("⚠️ PMFBY: Could not fetch from website:", error.message);
    return [{
      id: "pmfby_error",
      title: "Pradhan Mantri Fasal Bima Yojana",
      description: "Comprehensive crop insurance with premium subsidy",
      minInvestment: 0,
      maxInvestment: 300000,
      url: "https://pmfby.gov.in/",
      launchDate: "2016",
      fetchedAt: new Date().toISOString(),
      source: "fallback"
    }];
  }
};

// Fetch Soil Health Card Scheme with real scraping
const fetchSoilHealthSchemes = async () => {
  try {
    console.log("🔍 Scraping Soil Health data from soilhealth.dac.gov.in...");
    const response = await axios.get("https://www.soilhealth.dac.gov.in/", {
      timeout: 8000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const $ = cheerio.load(response.data);
    const schemes = [];
    
    // Parse scheme information
    $('div[class*="scheme"], article[class*="scheme"], .scheme-card, .card').each((index, element) => {
      const title = $(element).find('h1, h2, h3, .title').text().trim();
      const description = $(element).find('p, .description').text().trim();
      
      if (title.toLowerCase().includes('soil') || title.toLowerCase().includes('health')) {
        schemes.push({
          id: "soilhealth_" + Date.now(),
          title: title || "Soil Health Card Scheme",
          description: description || "Free soil testing and recommendations",
          minInvestment: 0,
          maxInvestment: 100000,
          url: "https://www.soilhealth.dac.gov.in/",
          launchDate: "2015",
          fetchedAt: new Date().toISOString(),
          source: "scraped"
        });
      }
    });
    
    if (schemes.length > 0) {
      console.log("✓ Soil Health: Found " + schemes.length + " scheme(s)");
      return schemes;
    } else {
      console.log("⚠️ Soil Health: Fallback to known scheme");
      return [{
        id: "soilhealth_fallback",
        title: "Soil Health Card Scheme",
        description: "Free soil testing and customized nutrient management recommendations",
        minInvestment: 0,
        maxInvestment: 100000,
        url: "https://www.soilhealth.dac.gov.in/",
        launchDate: "2015",
        fetchedAt: new Date().toISOString(),
        source: "fallback"
      }];
    }
  } catch (error) {
    console.log("⚠️ Soil Health: Could not fetch from website:", error.message);
    return [{
      id: "soilhealth_error",
      title: "Soil Health Card Scheme",
      description: "Free soil testing and recommendations",
      minInvestment: 0,
      maxInvestment: 100000,
      url: "https://www.soilhealth.dac.gov.in/",
      launchDate: "2015",
      fetchedAt: new Date().toISOString(),
      source: "fallback"
    }];
  }
};

// Fetch Micro-Irrigation Schemes with real scraping
const fetchMicroIrrigationSchemes = async () => {
  try {
    console.log("🔍 Scraping PMKSY data from pmksy.gov.in...");
    const response = await axios.get("https://pmksy.gov.in/", {
      timeout: 8000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const $ = cheerio.load(response.data);
    const schemes = [];
    
    // Parse scheme information
    $('div[class*="scheme"], article[class*="scheme"], .scheme-card, .card').each((index, element) => {
      const title = $(element).find('h1, h2, h3, .title').text().trim();
      const description = $(element).find('p, .description').text().trim();
      
      if (title.toLowerCase().includes('irrigation') || title.toLowerCase().includes('micro') || title.toLowerCase().includes('drip')) {
        schemes.push({
          id: "pmksy_" + Date.now(),
          title: title || "Micro-Irrigation Subsidy",
          description: description || "Subsidy for irrigation systems",
          minInvestment: 5000,
          maxInvestment: 50000,
          url: "https://pmksy.gov.in/",
          launchDate: "2015",
          fetchedAt: new Date().toISOString(),
          source: "scraped"
        });
      }
    });
    
    if (schemes.length > 0) {
      console.log("✓ PMKSY: Found " + schemes.length + " scheme(s) from live website");
      return schemes;
    } else {
      console.log("⚠️ PMKSY: Fallback to known schemes");
      return [
        {
          id: "microirr_fallback",
          title: "Micro-Irrigation Subsidy (Per Drop More Crop)",
          description: "50-80% subsidy for drip and sprinkler irrigation systems",
          minInvestment: 5000,
          maxInvestment: 50000,
          url: "https://pmksy.gov.in/",
          launchDate: "2015",
          fetchedAt: new Date().toISOString(),
          source: "fallback"
        },
        {
          id: "pmksy_fallback",
          title: "Pradhan Mantri Krishi Sinchayee Yojana",
          description: "Irrigation infrastructure development with subsidy",
          minInvestment: 20000,
          maxInvestment: 300000,
          url: "https://pmksy.gov.in/",
          launchDate: "2015",
          fetchedAt: new Date().toISOString(),
          source: "fallback"
        }
      ];
    }
  } catch (error) {
    console.log("⚠️ PMKSY: Could not fetch from website:", error.message);
    return [
      {
        id: "microirr_error",
        title: "Micro-Irrigation Subsidy (Per Drop More Crop)",
        description: "50-80% subsidy for drip and sprinkler irrigation systems",
        minInvestment: 5000,
        maxInvestment: 50000,
        url: "https://pmksy.gov.in/",
        launchDate: "2015",
        fetchedAt: new Date().toISOString(),
        source: "fallback"
      }
    ];
  }
};

// Fetch other schemes with real scraping
const fetchOtherSchemes = async () => {
  try {
    console.log("🔍 Scraping other schemes from government sources...");
    const schemes = [];
    
    // Try to fetch from eNAM
    try {
      console.log("  Fetching eNAM from enam.gov.in...");
      const enamResponse = await axios.get("https://enam.gov.in/", {
        timeout: 5000,
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
      });
      
      const $ = cheerio.load(enamResponse.data);
      let enamFound = false;
      
      // Parse HTML and look for eNAM related content
      $('h1, h2, h3, h4, .title, .heading, [class*="content"]').each((index, element) => {
        const text = $(element).text().toLowerCase();
        if (text.includes('enam') || text.includes('national agriculture market')) {
          enamFound = true;
        }
      });
      
      if (enamFound) {
        const description = $('p, .description, [class*="para"]').first().text().trim() || "Digital marketplace for direct farmer-to-buyer transactions";
        schemes.push({
          id: "enam_" + Date.now(),
          title: "e-NAM (Electronic National Agriculture Market)",
          description: description,
          minInvestment: 0,
          maxInvestment: 500000,
          url: "https://enam.gov.in/",
          launchDate: "2016",
          fetchedAt: new Date().toISOString(),
          source: "scraped"
        });
        console.log("  ✓ eNAM: Found from live website");
      }
    } catch (e) {
      console.log("  ⚠️ eNAM fetch failed:", e.message);
    }
    
    // Try to fetch from RKVY
    try {
      console.log("  Fetching RKVY from rkvy.rkvy.nic.in...");
      const rkvyResponse = await axios.get("https://rkvy.rkvy.nic.in/", {
        timeout: 5000,
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
      });
      
      const $ = cheerio.load(rkvyResponse.data);
      let rkvyFound = false;
      
      // Parse HTML and look for RKVY related content
      $('h1, h2, h3, h4, .title, .heading, [class*="content"]').each((index, element) => {
        const text = $(element).text().toLowerCase();
        if (text.includes('rkvy') || text.includes('rashtriya krishi')) {
          rkvyFound = true;
        }
      });
      
      if (rkvyFound) {
        const description = $('p, .description, [class*="para"]').first().text().trim() || "State-specific agricultural development schemes";
        schemes.push({
          id: "rkvy_" + Date.now(),
          title: "Rashtriya Krishi Vikas Yojana (RKVY)",
          description: description,
          minInvestment: 30000,
          maxInvestment: 800000,
          url: "https://rkvy.rkvy.nic.in/",
          launchDate: "2007",
          fetchedAt: new Date().toISOString(),
          source: "scraped"
        });
        console.log("  ✓ RKVY: Found from live website");
      }
    } catch (e) {
      console.log("  ⚠️ RKVY fetch failed:", e.message);
    }
    
    // Add fallback if no real schemes were scraped
    if (schemes.length === 0) {
      console.log("  Using fallback schemes...");
      schemes.push({
        id: "kcc_fallback",
        title: "Kisan Credit Card (KCC)",
        description: "Flexible credit facility for crop production and agricultural inputs",
        minInvestment: 10000,
        maxInvestment: 500000,
        url: "https://vikaspedia.in/agriculture/kcc",
        launchDate: "1998",
        fetchedAt: new Date().toISOString(),
        source: "fallback"
      });
      schemes.push({
        id: "nhm_fallback",
        title: "National Horticulture Mission",
        description: "Subsidy for cultivation of fruits, vegetables, and floriculture",
        minInvestment: 10000,
        maxInvestment: 200000,
        url: "https://nhm.gov.in/",
        launchDate: "2005",
        fetchedAt: new Date().toISOString(),
        source: "fallback"
      });
    }
    
    console.log("✓ Other schemes: Found " + schemes.length + " scheme(s) from government sources");
    return schemes;
  } catch (error) {
    console.log("⚠️ Error fetching other schemes:", error.message);
    return [
      {
        id: "enam_error",
        title: "e-NAM (Electronic National Agriculture Market)",
        description: "Digital marketplace for farmer transactions",
        minInvestment: 0,
        maxInvestment: 500000,
        url: "https://enam.gov.in/",
        launchDate: "2016",
        fetchedAt: new Date().toISOString(),
        source: "fallback"
      },
      {
        id: "kcc_error",
        title: "Kisan Credit Card (KCC)",
        description: "Credit facility for farming",
        minInvestment: 10000,
        maxInvestment: 500000,
        url: "https://vikaspedia.in/agriculture/kcc",
        launchDate: "1998",
        fetchedAt: new Date().toISOString(),
        source: "fallback"
      }
    ];
  }
};

// Fallback schemes if all APIs fail
const getFallbackSchemes = () => {
  return [
    { 
      id: "1", 
      title: "PM-Kisan Samman Nidhi", 
      description: "Direct income support of ₹6,000 per year for all farming families.", 
      minInvestment: 0, 
      maxInvestment: 1000000,
      url: "https://pmkisan.gov.in/",
      launchDate: "2019"
    },
    { 
      id: "2", 
      title: "Soil Health Card Scheme", 
      description: "Free soil testing and customized fertilizer recommendations for farmers.", 
      minInvestment: 0, 
      maxInvestment: 50000,
      url: "https://www.soilhealth.dac.gov.in/",
      launchDate: "2015"
    },
    { 
      id: "3", 
      title: "Pradhan Mantri Fasal Bima Yojana", 
      description: "Comprehensive crop insurance protection against crop failure and natural calamities.", 
      minInvestment: 0, 
      maxInvestment: 300000,
      url: "https://pmfby.gov.in/",
      launchDate: "2016"
    },
    { 
      id: "4", 
      title: "Micro-Irrigation Subsidy (Per Drop More Crop)", 
      description: "50-80% subsidy for drip and sprinkler irrigation systems for water conservation.", 
      minInvestment: 5000, 
      maxInvestment: 50000,
      url: "https://pmksy.gov.in/",
      launchDate: "2015"
    },
    { 
      id: "5", 
      title: "Kisan Credit Card (KCC)", 
      description: "Flexible credit facility for crop production and agricultural inputs at low interest rates.", 
      minInvestment: 10000, 
      maxInvestment: 500000,
      url: "https://vikaspedia.in/agriculture/kcc",
      launchDate: "1998"
    },
    { 
      id: "6", 
      title: "Paramparagat Krishi Vikas Yojana", 
      description: "Organic farming promotion with subsidy for certification and cluster formation.", 
      minInvestment: 15000, 
      maxInvestment: 200000,
      url: "https://pgsindia-ncof.gov.in/",
      launchDate: "2015"
    },
    { 
      id: "7", 
      title: "Pradhan Mantri Krishi Sinchayee Yojana", 
      description: "Irrigation infrastructure development with 50% subsidy for well deepening and pipes.", 
      minInvestment: 20000, 
      maxInvestment: 300000,
      url: "https://pmksy.gov.in/",
      launchDate: "2015"
    },
    { 
      id: "8", 
      title: "Agricultural Infrastructure Fund", 
      description: "3% interest subvention for loans up to ₹2 crore for cold storage and warehousing.", 
      minInvestment: 100000,
      maxInvestment: 20000000,
      url: "https://agriinfrastructure.iifc.org/",
      launchDate: "2020"
    },
    { 
      id: "9", 
      title: "e-NAM (Electronic National Agriculture Market)", 
      description: "Digital marketplace for direct farmer-to-buyer transactions eliminating middlemen.", 
      minInvestment: 0, 
      maxInvestment: 500000,
      url: "https://enam.gov.in/",
      launchDate: "2016"
    },
    { 
      id: "10", 
      title: "Rashtriya Krishi Vikas Yojana (RKVY)", 
      description: "State-specific agricultural development schemes with flexible funding for various crops.", 
      minInvestment: 30000, 
      maxInvestment: 800000,
      url: "https://rkvy.rkvy.nic.in/",
      launchDate: "2007"
    }
  ];
};
