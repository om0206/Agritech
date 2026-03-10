# Crop Journey Testing & Integration Checklist

## ✅ What's Been Implemented

### Database
- [x] `crop_journey_logs` table created
- [x] `crop_journey_notifications` table created
- [x] Foreign key relationships established

### Backend APIs
- [x] POST `/farmers/:id/journey/:journeyId/water-log` - Add water log
- [x] POST `/farmers/:id/journey/:journeyId/fertilizer-log` - Add fertilizer log
- [x] GET `/farmers/:id/journey/:journeyId/logs` - Get all logs
- [x] POST `/farmers/:id/journey/:journeyId/notification` - Schedule reminder
- [x] GET `/farmers/:id/notifications/pending` - Get pending notifications
- [x] PUT `/farmers/:id/notification/:notificationId/sent` - Mark as sent
- [x] GET `/farmers/:id/journey/:journeyId/complete` - Get complete journey with all data

### Frontend
- [x] `CropJourneyCard.jsx` component created with:
  - [x] Display current crop journey
  - [x] Add water/fertilizer logs with modal forms
  - [x] Filter logs by type
  - [x] Schedule reminders
  - [x] View pending notifications
  - [x] Responsive UI with theme support

- [x] `notificationService.js` created with:
  - [x] Permission handling
  - [x] Local notification scheduling
  - [x] Pending notification checking
  - [x] Notification marking as sent

- [x] Integrated into home screen:
  - [x] Added theme configuration
  - [x] Conditional rendering based on crop lock status
  - [x] Proper styling and layout

## 📦 Required Installation

```bash
cd Agritech-Frontend
npm install expo-notifications
```

## 🧪 Testing Steps

### 1. Verify Database Tables
```bash
# SSH into your backend or use sqlite3 CLI
sqlite3 farmers.db

# Check if tables exist
.tables

# See schema
.schema crop_journey_logs
.schema crop_journey_notifications
```

### 2. Test Backend APIs with cURL

#### Add Water Log
```bash
curl -X POST http://localhost:5000/farmers/1/journey/1/water-log \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "quantity": 50,
    "logDate": "2026-03-10",
    "notes": "Morning watering"
  }'
```

#### Get Logs
```bash
curl -X GET http://localhost:5000/farmers/1/journey/1/logs \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Schedule Notification
```bash
curl -X POST http://localhost:5000/farmers/1/journey/1/notification \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "notificationType": "water",
    "scheduledDate": "2026-03-12",
    "scheduledTime": "09:00",
    "message": "Time to water the crop"
  }'
```

#### Get Pending Notifications
```bash
curl -X GET http://localhost:5000/farmers/1/notifications/pending \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. Test Frontend in App

1. **Login** with your farmer account
2. **Select and lock a crop** (must select sowing date)
3. **See "Crop Journey" section** appear on home screen
4. **Add Water Log**:
   - Click "Add Water" button
   - Enter quantity (e.g., 50)
   - Select date
   - Click "Save Log"
   - Verify log appears in the list

5. **Add Fertilizer Log**:
   - Click "Add Fertilizer" button
   - Follow same steps as water log
   - Verify in "Fertilizer" tab

6. **Schedule Reminder**:
   - Click "Add Reminder"
   - Select type (Water/Fertilizer)
   - Choose future date
   - Enter time (e.g., 09:00)
   - Write message
   - Click "Schedule Reminder"

7. **Verify Notifications**:
   - Check "Upcoming Reminders" section shows your reminder
   - When reminder time arrives, should see notification (if on app)

## 🐛 Debug Logging

### Frontend Console Logs
The CropJourneyCard component has built-in logging. Check your expo console for:
- `✓ Journey data fetched`
- `✓ Logs loaded`
- `✓ Water/Fertilizer log added`
- `✓ Notification scheduled`

### Backend Console Logs
The controller logs activity:
- `✅ Crop journey saved`
- `✅ Water log added`
- `✅ Fertilizer log added`
- `✅ Notification created`

## 📋 Common Issues & Solutions

### Issue: "Component not showing"
**Solution**: Ensure you've locked a crop first. The component only shows when `isLocked === true`.

### Issue: "Notification API returns 404"
**Solution**: Verify the journey ID is correct. Check backend logs for the journeyId value.

### Issue: "Can't type in date picker"
**Solution**: This is normal behavior. Use the date picker UI or manually type in TextInput.

### Issue: "expo-notifications not found"
**Solution**: 
```bash
npm install expo-notifications
npm start -- --clear
```

### Issue: "Authorization errors"
**Solution**: Ensure valid JWT token is being sent. Check:
```javascript
const token = await getAuthToken();
console.log('Token:', token); // Should not be null
```

## 🔄 Integration Flow

```
Home Screen
    ↓
[Is Crop Locked?]
    ↓
   YES
    ↓
Render CropJourneyCard
    ↓
User adds log/notification
    ↓
Frontend API call
    ↓
Backend saves to SQLite
    ↓
Frontend refreshes list
    ↓
User sees new entry
```

## 📱 Notification Flow

```
User schedules reminder
    ↓
Saved in crop_journey_notifications table
    ↓
Frontend calls checkAndSendPendingNotifications()
    ↓
Checks if date <= today
    ↓
Schedules local notification
    ↓
Marks as sent in database
    ↓
OS/Device shows notification
    ↓
Farmer sees reminder
```

## 🎯 Performance Tips

1. **Logs are fetched on mount** - If you have 100+ logs, consider pagination
2. **Notifications checked on app open** - Add interval checking for background:
   ```javascript
   useEffect(() => {
     const interval = setInterval(() => {
       checkAndSendPendingNotifications(farmerId);
     }, 60000); // Check every minute
     return () => clearInterval(interval);
   }, []);
   ```

3. **Large lists** - Implement FlatList virtualization (already done in CropJourneyCard)

## 📊 Data Validation

All API endpoints validate:
- Required fields present
- Data types correct
- Date formats valid (YYYY-MM-DD)
- Time format valid (HH:MM)
- Foreign keys exist
- Authorization tokens valid

## 🚀 Deployment Checklist

- [ ] Test all APIs with Postman
- [ ] Verify database migrations run
- [ ] Test app with fresh install
- [ ] Test notifications on real device
- [ ] Check push notification permissions
- [ ] Monitor backend logs during testing
- [ ] Get user feedback on UI/UX
- [ ] Plan monitoring strategy for production

## 📞 Quick Commands

```bash
# Restart backend
cd backend && npm start

# Restart frontend
cd Agritech-Frontend && npm start

# Clear all frontend cache
npm start -- --clear

# Check installed packages
npm list expo-notifications

# View database contents (if using sqlite3 CLI)
sqlite3 farmers.db ".mode column" "SELECT * FROM crop_journey_logs;"
```

## ✨ Ready to Use

The Crop Journey feature is fully implemented and ready for testing. All components are integrated and the APIs are documented. Follow the testing steps above to verify everything works correctly.

