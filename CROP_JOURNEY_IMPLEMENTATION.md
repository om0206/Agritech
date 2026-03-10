# Crop Journey Feature - Complete Implementation Guide

## 📋 Overview

I've successfully built the **Crop Journey** feature for your Agritech app. This feature allows farmers to:
- View their active crop journey with water and fertilizer tracking
- Log water and fertilizer applications with dates and quantities
- Schedule reminders for upcoming water/fertilizer tasks
- Receive push notifications for scheduled reminders
- View complete history of all crop activities

## 🗂️ What Was Built

### 1. **Backend Components**

#### Database Schema Updates (`backend/database/database.js`)
- **crop_journey_logs** table: Stores all water and fertilizer application logs
  - `id`: Primary key
  - `journey_id`: Links to the crop journey
  - `farmer_id`: Links to farmer
  - `log_type`: 'water' or 'fertilizer'
  - `quantity`: Amount applied
  - `log_date`: Date of application
  - `notes`: Optional notes
  
- **crop_journey_notifications** table: Stores notification reminders
  - `id`: Primary key
  - `farmer_id`: Links to farmer
  - `journey_id`: Links to crop journey
  - `notification_type`: 'water' or 'fertilizer'
  - `scheduled_date`: When to send reminder
  - `scheduled_time`: Time to send reminder
  - `message`: Notification message
  - `is_sent`: Whether notification was sent

#### API Endpoints (`backend/routes/cropJourney.js` & `backend/controllers/cropJourneyController.js`)

**Water & Fertilizer Logs:**
```
POST   /farmers/:id/journey/:journeyId/water-log       → Add water log
POST   /farmers/:id/journey/:journeyId/fertilizer-log  → Add fertilizer log
GET    /farmers/:id/journey/:journeyId/logs            → Get all logs
```

**Notifications:**
```
POST   /farmers/:id/journey/:journeyId/notification    → Schedule reminder
GET    /farmers/:id/notifications/pending              → Get pending notifications
PUT    /farmers/:id/notification/:notificationId/sent  → Mark as sent
```

**Complete Journey Data:**
```
GET    /farmers/:id/journey/:journeyId/complete        → Get journey + logs + notifications
```

### 2. **Frontend Components**

#### Crop Journey Card (`Agritech-Frontend/components/CropJourneyCard.jsx`)
A complete, self-contained component that displays:
- Current active crop with sowing date
- Action buttons to add water/fertilizer logs
- Add reminder button
- Filterable log history (All, Water, Fertilizer)
- Pending notifications display
- Modal forms for adding logs and scheduling reminders
- Complete UI with theme support

#### Notification Service (`Agritech-Frontend/services/notificationService.js`)
Handles:
- Permission requests for notifications
- Scheduling local notifications
- Checking and sending pending notifications
- Marking notifications as sent in backend
- Helper functions for notification management

#### Home Screen Integration (`Agritech-Frontend/app/(tabs)/home.js`)
- Imported and integrated CropJourneyCard
- Added theme configuration object
- Conditional rendering: Crop Journey section shows only when crop is locked
- Added styling for the new section

## ⚙️ Installation & Setup

### Step 1: Install Required Packages

Navigate to the frontend directory and install `expo-notifications`:

```bash
cd Agritech-Frontend
npm install expo-notifications
# or
yarn add expo-notifications
```

### Step 2: Restart Development Server

```bash
npm start
# or
yarn start
```

Then rebuild/restart your app to ensure all packages are properly linked.

### Step 3: Android/iOS Configuration (If needed)

For Android, Expo handles notifications automatically. For iOS, ensure you have proper notification entitlements.

### Step 4: Test the Feature

1. Log in to your app
2. Select and lock a crop (sowing date)
3. The "Crop Journey" section will appear on the home screen
4. Click "Add Water" or "Add Fertilizer" to log activities
5. Click "Add Reminder" to schedule notifications

## 📱 Feature Usage

### Adding a Water/Fertilizer Log

1. Tap **"Add Water"** or **"Add Fertilizer"** button
2. Enter quantity (in your preferred units: liters, kg, etc.)
3. Select the date of application
4. Optionally add notes
5. Tap **"Save Log"**

### Scheduling a Reminder

1. Tap **"Add Reminder"**
2. Select reminder type (Water or Fertilizer)
3. Choose the date you want to be reminded
4. Enter time (HH:MM format, e.g., 09:00)
5. Write a reminder message (e.g., "Water the wheat crop")
6. Tap **"Schedule Reminder"**

### Viewing Logs

- Filter logs using the tabs: **All**, **Water**, **Fertilizer**
- Logs are sorted by date (newest first)
- Each log shows: date, quantity, and notes

### Pending Notifications

- Upcoming reminders are displayed in the "Upcoming Reminders" section
- Shows date and time for each reminder
- Automatically marked as sent when notification is displayed

## 🔔 Notification System

### How It Works

1. **Schedule**: Farmer creates a reminder via the app
2. **Store**: Reminder is saved in `crop_journey_notifications` table
3. **Check**: Frontend calls `checkAndSendPendingNotifications()` periodically
4. **Send**: When date/time arrives, local notification is sent
5. **Mark**: Notification is marked as sent in the database

### Integrating Notifications in Your App

Add this to your home screen or app initialization to check for pending notifications:

```javascript
import { checkAndSendPendingNotifications, requestNotificationPermissions } from '../../services/notificationService';
import { useFocusEffect } from 'expo-router';

// In your screen component
useFocusEffect(() => {
  if (farmerData?.id) {
    // Request permissions first time
    requestNotificationPermissions();
    
    // Check and send pending notifications
    checkAndSendPendingNotifications(farmerData.id);
  }
});
```

## 🌾 API Examples

### Add Water Log
```bash
POST /farmers/1/journey/5/water-log
Authorization: Bearer <token>
Content-Type: application/json

{
  "quantity": 50,
  "logDate": "2026-03-10",
  "notes": "Evening watering"
}
```

**Response:**
```json
{
  "message": "Water log recorded successfully",
  "logId": 10,
  "journeyId": 5,
  "quantity": 50,
  "logDate": "2026-03-10"
}
```

### Get All Logs
```bash
GET /farmers/1/journey/5/logs
Authorization: Bearer <token>
```

**Response:**
```json
{
  "journeyId": 5,
  "totalLogs": 8,
  "waterLogs": [...],
  "fertilizerLogs": [...],
  "allLogs": [...]
}
```

### Schedule Notification
```bash
POST /farmers/1/journey/5/notification
Authorization: Bearer <token>
Content-Type: application/json

{
  "notificationType": "water",
  "scheduledDate": "2026-03-12",
  "scheduledTime": "09:00",
  "message": "Time to water the wheat crop"
}
```

### Get Pending Notifications
```bash
GET /farmers/1/notifications/pending
Authorization: Bearer <token>
```

## 🎨 Theme Customization

The CropJourneyCard accepts a `theme` prop for styling. You can customize colors:

```javascript
const customTheme = {
  background: '#FFFFFF',
  text: '#333333',
  textSecondary: '#999999',
  accent: '#4CAF50',           // Primary green
  secondary: '#FF9800',         // Orange for fertilizer
  tertiary: '#2196F3',          // Blue for reminders
  border: '#E0E0E0',
  lightBlue: '#E3F2FD',
  lightOrange: '#FFF3E0',
  lightAccent: '#F1F8E9',
};

<CropJourneyCard farmerId={farmerData?.id} theme={customTheme} />
```

## 📊 Database Schema

### crop_journey_logs
```sql
CREATE TABLE crop_journey_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  journey_id INTEGER NOT NULL,
  farmer_id INTEGER NOT NULL,
  log_type TEXT NOT NULL CHECK(log_type IN ('water', 'fertilizer')),
  quantity REAL DEFAULT NULL,
  log_date TEXT NOT NULL,
  notes TEXT DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (journey_id) REFERENCES crop_journey(id),
  FOREIGN KEY (farmer_id) REFERENCES farmers(id)
)
```

### crop_journey_notifications
```sql
CREATE TABLE crop_journey_notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  farmer_id INTEGER NOT NULL,
  journey_id INTEGER NOT NULL,
  notification_type TEXT NOT NULL CHECK(notification_type IN ('water', 'fertilizer')),
  scheduled_date TEXT NOT NULL,
  scheduled_time TEXT DEFAULT NULL,
  message TEXT NOT NULL,
  is_sent INTEGER DEFAULT 0,
  sent_at DATETIME DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (farmer_id) REFERENCES farmers(id),
  FOREIGN KEY (journey_id) REFERENCES crop_journey(id)
)
```

## 🔧 Troubleshooting

### Notifications not appearing?
1. Ensure `expo-notifications` is installed: `npm list expo-notifications`
2. Check that permissions are granted on device
3. Verify notification date/time is correctly formatted
4. Check app console for any error messages

### Logs not saving?
1. Verify farmer/journey IDs are correct
2. Check network connectivity
3. Ensure date format is YYYY-MM-DD
4. Check backend error logs

### CropJourneyCard not visible?
1. Ensure crop is locked (selected with sowing date)
2. Check that farmerId is being passed correctly
3. Verify theme object has all required properties

## 🚀 Next Steps (Optional Enhancements)

1. **Groq API Integration** for AI-powered recommendations on water/fertilizer schedules
2. **Analytics Dashboard** showing water usage trends
3. **Export Reports** as PDF with crop journey history
4. **Farmer Community** to share best practices
5. **Weather-based Alerts** automatically suggesting water based on rain/temperature
6. **Push Notifications** via Firebase Cloud Messaging for more reliability

## 📝 Files Modified/Created

### Created:
- `/Agritech-Frontend/components/CropJourneyCard.jsx`
- `/Agritech-Frontend/services/notificationService.js`
- `/CROP_JOURNEY_IMPLEMENTATION.md` (this file)

### Modified:
- `/backend/database/database.js` - Added new tables
- `/backend/routes/cropJourney.js` - Added new endpoints
- `/backend/controllers/cropJourneyController.js` - Added controller methods
- `/Agritech-Frontend/app/(tabs)/home.js` - Integrated CropJourneyCard

## 📞 Support

For issues or questions:
1. Check the API logs on your backend (express console)
2. Verify database tables were created: `SELECT * FROM crop_journey_logs LIMIT 1;`
3. Test endpoints directly using Postman or curl
4. Check device logs in your IDE (Android Studio / Xcode)

---

**Implementation completed on: March 10, 2026**
**Status: ✅ Ready for testing and deployment**
