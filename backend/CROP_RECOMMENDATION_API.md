# Crop Recommendation API Documentation

This API provides crop recommendations for farmers based on:
- **Temperature & Humidity** - Fetched automatically using WeatherAPI based on location
- **Soil Type** - Stored in farmer profile
- **Water Availability** - Stored in farmer profile

## Setup Instructions

### 1. Install Python Dependencies
The Python service requires pickle (built-in) and you need to have Python 3.x installed.

### 2. Configure WeatherAPI
The API uses WeatherAPI to fetch real-time weather data. 

**Option A: Use Default Demo Key (Limited)**
- A demo key is provided in the code: `5c6c9a54b5a94dcd8a8144805242503`
- Free tier allows 1 million calls/month

**Option B: Use Your Own API Key**
1. Sign up at https://www.weatherapi.com (free tier available)
2. Get your API key from the dashboard
3. Set environment variable:
   ```bash
   set WEATHER_API_KEY=your_api_key_here
   ```

### 3. Verify Trained Models
Ensure these files exist in `/Crop_recommend/` folder:
- `crop_model.pkl` - Trained crop recommendation model
- `soil_encoder.pkl` - Soil type encoder
- `crop_encoder.pkl` - Crop encoder

## API Endpoints

### 1. Get Recommendations for Single Farmer
**GET** `/api/farmers/:id/crop-recommendations`

**Description:** Get crop recommendations for a specific farmer using their profile data.

**Parameters:**
- `id` (path parameter) - Farmer ID

**Response Example:**
```json
{
  "success": true,
  "farmerId": 1,
  "farmerName": "John Doe",
  "location": "Mumbai, Maharashtra",
  "weather": {
    "temperature": "32.5°C",
    "humidity": "65%"
  },
  "farmConditions": {
    "soilType": "Loamy Soil",
    "waterAvailability": "1200mm"
  },
  "recommendations": [
    {
      "crop": "Rice",
      "probability": 42.5,
      "confidence": "High"
    },
    {
      "crop": "Wheat",
      "probability": 28.3,
      "confidence": "Medium"
    },
    {
      "crop": "Sugarcane",
      "probability": 15.2,
      "confidence": "Medium"
    }
  ]
}
```

---

### 2. Get Recommendations for All Farmers
**GET** `/api/farmers/recommendations/all`

**Description:** Get crop recommendations for all farmers in the database.

**Response Example:**
```json
{
  "success": true,
  "totalFarmers": 5,
  "processedFarmers": 5,
  "recommendations": [
    {
      "farmerId": 1,
      "farmerName": "John Doe",
      "location": "Mumbai",
      "weather": {"temperature": "32.5°C", "humidity": "65%"},
      "farmConditions": {"soilType": "Loamy Soil", "waterAvailability": "1200mm"},
      "recommendations": [...]
    },
    ...
  ],
  "errors": null
}
```

---

### 3. Predict Crops with Custom Parameters
**POST** `/api/farmers/recommendations/predict`

**Description:** Get crop recommendations with custom parameters (no need to be a registered farmer).

**Request Body:**
```json
{
  "location": "Pune, Maharashtra",
  "soilType": "Clayey Soil",
  "waterAvailability": 900
}
```

**Response:**
```json
{
  "success": true,
  "location": "Pune, Maharashtra",
  "weather": {
    "temperature": "28.3°C",
    "humidity": "58%"
  },
  "farmConditions": {
    "soilType": "Clayey Soil",
    "waterAvailability": "900mm"
  },
  "recommendations": [
    {
      "crop": "Cotton",
      "probability": 38.9,
      "confidence": "High"
    },
    {
      "crop": "Groundnut",
      "probability": 32.1,
      "confidence": "High"
    },
    {
      "crop": "Jowar",
      "probability": 19.0,
      "confidence": "Medium"
    }
  ]
}
```

---

## Soil Type Values
Use these values for soil type in requests:
- `Loamy Soil`
- `Clayey Soil`
- `Sandy Soil`
- `Alluvial Soil`
- `Laterite Soil`
- `Black Soil`
- `Red Soil`

(Adjust based on your encoded soil types in the model)

---

## Water Availability (mm) Values
Common water availability ranges:
- **400-600mm** - Low (Rainfed, Drip Irrigation)
- **700-900mm** - Moderate (Limited Borewell, Rainwater Harvesting)
- **1000-1200mm** - Adequate (Well Water, Adequate Borewell)
- **1500-2000mm** - High (Canal Irrigation, Tap Water)

---

## Error Handling

**Invalid Location:**
```json
{
  "error": "Failed to fetch weather data for location: InvalidCity"
}
```

**Farmer Not Found:**
```json
{
  "message": "Farmer not found"
}
```

**Model Loading Error:**
```json
{
  "error": "Failed to load models: [error details]"
}
```

**Unknown Soil Type:**
```json
{
  "error": "Unknown soil type: UnknownSoil"
}
```

---

## How It Works

1. **Weather Data**: When you request recommendations, the system automatically fetches current temperature and humidity for the farmer's location using WeatherAPI.
2. **Model Prediction**: The trained ML model takes 4 inputs:
   - Temperature (°C)
   - Humidity (%)
   - Soil Type (encoded)
   - Water Availability (mm)
3. **Top 3 Crops**: Returns the 3 most recommended crops with confidence scores.

---

## Troubleshooting

### Python Script Not Running
- Ensure Python 3.x is installed and in your PATH
- Test: Run `python --version` in terminal

### Weather API Errors
- Check your internet connection
- Verify location names (use city names, not coordinates if facing issues)
- Check API key validity (if using custom key)

### Model Not Found
- Ensure `/Crop_recommend/` folder contains the three pickle files
- Check file permissions

---

## Example Usage in Frontend

```javascript
// Get recommendations for logged-in farmer
async function getFarmerRecommendations(farmerId) {
  const response = await fetch(`/api/farmers/${farmerId}/crop-recommendations`);
  const data = await response.json();
  console.log(data.recommendations);
}

// Get recommendations with custom parameters
async function getPredictions() {
  const response = await fetch("/api/farmers/recommendations/predict", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      location: "Delhi",
      soilType: "Alluvial Soil",
      waterAvailability: 1200
    })
  });
  const data = await response.json();
  console.log(data.recommendations);
}
```

---

## Notes

- The system caches nothing; each request fetches live weather data
- Weather API has rate limits based on your plan (1M/month on free tier)
- Model predictions depend on training data quality
- Location names should be city/region names for best results
