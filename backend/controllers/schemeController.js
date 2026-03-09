const axios = require("axios");
const cheerio = require("cheerio");

exports.scrapeGovSchemes = async (req, res) => {
  try {
    // A structured database of schemes covering all budget ranges
    const schemesDatabase = [
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
        title: "Sub-Mission on Agricultural Mechanization", 
        description: "Subsidized tractors, harvesters, and agricultural equipment for mechanized farming.", 
        minInvestment: 50000,
        maxInvestment: 1000000,
        url: "https://agrimachinery.gov.in/",
        launchDate: "2014"
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
      },
      { 
        id: "11", 
        title: "Agricultural Infrastructure Fund", 
        description: "3% interest subvention for loans up to ₹2 crore for cold storage, warehousing, and processing units.", 
        minInvestment: 100000,
        maxInvestment: null,
        url: "https://agriinfrastructure.iifc.org/",
        launchDate: "2020"
      },
      { 
        id: "12", 
        title: "National Horticulture Mission", 
        description: "Subsidy for cultivation of fruits, vegetables, floriculture, and medicinal plants.", 
        minInvestment: 10000, 
        maxInvestment: 200000,
        url: "https://nhm.gov.in/",
        launchDate: "2005"
      },
      { 
        id: "13", 
        title: "National Mission on Oil Seeds and Oil Palm", 
        description: "Production subsidy for oilseed farming to boost domestic oil production.", 
        minInvestment: 5000, 
        maxInvestment: 150000,
        url: "https://www.indiaagristat.com/",
        launchDate: "2014"
      },
      { 
        id: "14", 
        title: "Livestock Insurance Scheme", 
        description: "Protection for dairy animals and livestock against mortality with minimal premium.", 
        minInvestment: 0, 
        maxInvestment: 200000,
        url: "https://dahd.nic.in/",
        launchDate: "2018"
      },
      { 
        id: "15", 
        title: "Pradhan Mantri Annodaya Yojana", 
        description: "Food security and grain storage support for farmers to ensure fair prices during harvest.", 
        minInvestment: 20000, 
        maxInvestment: 400000,
        url: "https://fci.gov.in/",
        launchDate: "2017"
      }
    ];

    res.json({ success: true, data: schemesDatabase });

  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch schemes" });
  }
};