// Water Availability Options with corresponding mm values
const WATER_AVAILABILITY_OPTIONS = {
  LIMITED_BOREWELL: {
    label: "Limited Borewell",
    value: "limited_borewell",
    mmValue: 700
  },
  ADEQUATE_BOREWELL: {
    label: "Adequate Borewell",
    value: "adequate_borewell",
    mmValue: 1200
  },
  CANAL_IRRIGATION: {
    label: "Canal Irrigation",
    value: "canal_irrigation",
    mmValue: 1500
  },
  RAINWATER_HARVESTING: {
    label: "Rainwater Harvesting",
    value: "rainwater_harvesting",
    mmValue: 900
  },
  RAINFED_ONLY: {
    label: "Rainfed Only",
    value: "rainfed_only",
    mmValue: 400
  },
  WELL_WATER: {
    label: "Well Water",
    value: "well_water",
    mmValue: 1000
  },
  TAP_WATER: {
    label: "Tap Water",
    value: "tap_water",
    mmValue: 2000
  },
  DRIP_IRRIGATION: {
    label: "Drip Irrigation",
    value: "drip_irrigation",
    mmValue: 600
  },
  POOR: {
    label: "Poor",
    value: "poor",
    mmValue: 400
  }
};

// Function to get mm value from water availability option (handles both label and value)
const getWaterAvailabilityMm = (optionInput) => {
  // Try to find by value first
  let option = Object.values(WATER_AVAILABILITY_OPTIONS).find(
    opt => opt.value === optionInput
  );
  
  // If not found by value, try to find by label (case-insensitive)
  if (!option) {
    option = Object.values(WATER_AVAILABILITY_OPTIONS).find(
      opt => opt.label.toLowerCase() === String(optionInput).toLowerCase()
    );
  }
  
  return option ? option.mmValue : null;
};

// Function to get all options (for frontend dropdowns)
const getAllWaterAvailabilityOptions = () => {
  return Object.values(WATER_AVAILABILITY_OPTIONS).map(opt => ({
    label: opt.label,
    value: opt.value
  }));
};

// Function to convert mm value back to water availability label
const getLabelFromMm = (mmValue) => {
  const option = Object.values(WATER_AVAILABILITY_OPTIONS).find(
    opt => opt.mmValue === mmValue
  );
  return option ? option.label : null;
};

module.exports = {
  WATER_AVAILABILITY_OPTIONS,
  getWaterAvailabilityMm,
  getAllWaterAvailabilityOptions,
  getLabelFromMm
};
