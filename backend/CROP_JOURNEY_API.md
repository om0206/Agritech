# 🌾 Crop Journey API Documentation

## Overview
The Crop Journey system tracks each farmer's crop selection and sowing date management. Instead of storing crop data directly in the farmers table, it uses a separate `crop_journey` table to maintain a normalized database structure.

## Database Schema

### `crop_journey` Table
```sql
CREATE TABLE IF NOT EXISTS crop_journey (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  farmer_id INTEGER NOT NULL,
  crop_name TEXT NOT NULL,
  crop_sowing_date TEXT DEFAULT NULL,
  crop_sowing_date_locked INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (farmer_id) REFERENCES farmers(id)
)
```

**Columns:**
- `id`: Unique crop journey entry ID
- `farmer_id`: Reference to farmer (foreign key)
- `crop_name`: Name of the selected crop
- `crop_sowing_date`: Sowing date in YYYY-MM-DD format (NULL until set)
- `crop_sowing_date_locked`: Boolean flag (0 = editable, 1 = locked)
- `created_at`: Timestamp when crop was locked

## API Endpoints

### 1. Save Crop Journey Entry
**Endpoint:** `POST /farmers/:id/journey`

**Purpose:** Create a new crop journey entry when farmer locks a crop.

**Request Body:**
```json
{
  "cropName": "Wheat",
  "sowingDate": "2024-03-15" // optional
}
```

**Response (Success - 200):**
```json
{
  "message": "Crop journey recorded successfully",
  "journeyId": 1,
  "farmerId": 5,
  "cropName": "Wheat",
  "sowingDate": "2024-03-15" or null,
  "locked": false or true
}
```

**Response (Error - 400):**
```json
{
  "error": "Crop name is required"
}
```

---

### 2. Get Current Crop Journey
**Endpoint:** `GET /farmers/:id/journey/current`

**Purpose:** Retrieve the latest crop journey entry for a farmer (used on home page).

**Response (Success - 200):**
```json
{
  "farmerId": 5,
  "currentJourney": {
    "id": 1,
    "crop_name": "Wheat",
    "crop_sowing_date": "2024-03-15",
    "crop_sowing_date_locked": 1,
    "created_at": "2024-03-01T10:30:00.000Z"
  },
  "message": "Current crop journey retrieved successfully"
}
```

**Response (Error - 404):**
```json
{
  "message": "No crop journey found",
  "farmerId": 5
}
```

---

### 3. Get Crop Journey History
**Endpoint:** `GET /farmers/:id/journey/history`

**Purpose:** Retrieve all crop journey entries for a farmer (for history/analytics).

**Response (Success - 200):**
```json
{
  "farmerId": 5,
  "totalCropsTracked": 3,
  "cropHistory": [
    {
      "id": 3,
      "crop_name": "Cotton",
      "crop_sowing_date": null,
      "crop_sowing_date_locked": 0,
      "created_at": "2024-03-10T08:00:00.000Z"
    },
    {
      "id": 2,
      "crop_name": "Rice",
      "crop_sowing_date": "2024-02-20",
      "crop_sowing_date_locked": 1,
      "created_at": "2024-02-15T09:15:00.000Z"
    },
    {
      "id": 1,
      "crop_name": "Wheat",
      "crop_sowing_date": "2024-01-15",
      "crop_sowing_date_locked": 1,
      "created_at": "2024-01-10T11:45:00.000Z"
    }
  ],
  "message": "Crop journey history retrieved successfully"
}
```

---

### 4. Update Crop Journey Sowing Date
**Endpoint:** `PUT /farmers/:id/journey/sowing-date`

**Purpose:** Set and lock sowing date for the current (latest) crop journey entry.

**Request Body:**
```json
{
  "sowingDate": "2024-03-15"
}
```

**Response (Success - 200):**
```json
{
  "message": "Sowing date saved and locked successfully",
  "cropJourneyId": 1,
  "sowingDate": "2024-03-15",
  "locked": true
}
```

**Response (Error - 404):**
```json
{
  "message": "No crop journey found for this farmer"
}
```

**Response (Error - 400):**
```json
{
  "error": "Sowing date is required"
}
```

---

### 5. Delete Crop Journey Entry
**Endpoint:** `DELETE /farmers/:id/journey/:journeyId`

**Purpose:** Remove a crop journey entry (for data cleanup/correction).

**Response (Success - 200):**
```json
{
  "message": "Crop journey entry deleted successfully",
  "journeyId": 1
}
```

**Response (Error - 404):**
```json
{
  "message": "Crop journey entry not found"
}
```

---

## Frontend Integration

### Flow 1: Farmer Locks a Crop
1. User navigates to **Crop Recommendations** page
2. User selects a crop and confirms
3. Backend `POST /farmers/:id/select-crop` is called
4. Server creates a new crop journey entry automatically
5. Frontend receives success response

**Code Location:** [cropRecommendationController.js - selectAndLockCrop()](../controllers/cropRecommendationController.js)

### Flow 2: Farmer Sets Sowing Date
1. User navigates to **Home** page
2. If crop is locked, "Set Sowing Date" section appears
3. User opens date picker and selects a date
4. User taps "Save & Lock"
5. Frontend calls `PUT /farmers/:id/journey/sowing-date`
6. Backend updates the latest crop journey entry with the sowing date
7. Date becomes locked (read-only)

**Code Location:** [home.js - handleSaveSowingDate()](../app/(tabs)/home.js)

### Flow 3: Load Farmer's Current Crop Status
1. User navigates to **Home** page
2. Frontend calls `GET /farmers/:id/journey/current`
3. Backend returns latest crop journey with sowing date (if set)
4. UI displays:
   - Current crop name
   - Sowing date (if set)
   - Lock status

**Code Location:** [home.js - fetchCurrentCropJourney()](../app/(tabs)/home.js)

---

## Database Architecture Benefits

### Before (Farmers Table Bloat)
```
farmers table had too many columns:
- selected_crop
- crop_locked
- crop_selected_date
- crop_sowing_date
- crop_sowing_date_locked
→ One entry per farmer, no history tracking
```

### After (Normalized Structure)
```
farmers table: User profile (lean, focused)
crop_journey table: Crop tracking (normalized, scalable)
→ Multiple entries per farmer, full history tracking
→ Easy to query crop patterns over seasons
```

---

## Example Workflow

### Scenario: Farmer Arjun's Journey

**Step 1: Farmer locks Wheat crop (March 1st)**
```
POST /farmers/5/select-crop
Body: { "selectedCrop": "Wheat" }

→ Creates crop_journey entry:
{
  "id": 1,
  "farmer_id": 5,
  "crop_name": "Wheat",
  "crop_sowing_date": null,
  "crop_sowing_date_locked": 0,
  "created_at": "2024-03-01T10:30:00Z"
}
```

**Step 2: Farmer sets sowing date (March 5th)**
```
PUT /farmers/5/journey/sowing-date
Body: { "sowingDate": "2024-03-15" }

GET /farmers/5/journey/current

→ Returns:
{
  "id": 1,
  "farmer_id": 5,
  "crop_name": "Wheat",
  "crop_sowing_date": "2024-03-15",
  "crop_sowing_date_locked": 1,
  "created_at": "2024-03-01T10:30:00Z"
}
```

**Step 3: Query crop history (June)**
```
GET /farmers/5/journey/history

→ Shows all crops farmer has tracked:
- Wheat (March, sown 2024-03-15)
- Rice (January, sown 2024-01-10)
- Cotton (June, no sowing date yet)
```

---

## Authorization
All endpoints require `Authorization: Bearer {token}` header with valid JWT token from authentication.

---

## Error Handling

| Status Code | Scenario |
|-------------|----------|
| 200 | Success |
| 400 | Missing required field (crop name, sowing date) |
| 404 | Farmer or crop journey entry not found |
| 500 | Database error |

---

## Future Enhancements
- [ ] Add crop journey duration calculation (days from lock to sowing)
- [ ] Analytics dashboard showing farmer's crop patterns
- [ ] Yield tracking per crop journey
- [ ] Recommended harvest date based on crop type
- [ ] Crop rotation suggestions based on history

---

## Related Files
- Backend: [cropJourneyController.js](../controllers/cropJourneyController.js)
- Routes: [cropJourney.js](../routes/cropJourney.js)
- Database: [database.js](../database/database.js)
- Frontend: [home.js](../app/(tabs)/home.js)
- Crop selection: [cropRecommendationController.js](../controllers/cropRecommendationController.js)
