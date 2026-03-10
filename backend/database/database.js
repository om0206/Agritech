const sqlite3 = require("sqlite3").verbose();

const dbPath = process.env.DB_PATH || "./farmers.db";

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.log("Database error", err);
  } else {
    console.log("Connected to SQLite database at:", dbPath);
  }
});

db.run(`
CREATE TABLE IF NOT EXISTS farmers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT,
  email TEXT,
  password TEXT,
  mobile TEXT,
  location TEXT,
  landSize TEXT,
  soilDetails TEXT,
  waterAvailabilityMm INTEGER,
  investment TEXT,
  selected_crop TEXT DEFAULT NULL,
  crop_locked INTEGER DEFAULT 0,
  crop_selected_date TEXT DEFAULT NULL
)
`);

// Create crop_journey table for storing crop history
db.run(`
CREATE TABLE IF NOT EXISTS crop_journey (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  farmer_id INTEGER NOT NULL,
  crop_name TEXT NOT NULL,
  crop_sowing_date TEXT DEFAULT NULL,
  crop_sowing_date_locked INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (farmer_id) REFERENCES farmers(id)
)
`);

// Create crop_journey_logs table for tracking water and fertilizer applications
db.run(`
CREATE TABLE IF NOT EXISTS crop_journey_logs (
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
`);

// Create crop_journey_notifications table for scheduled reminders
db.run(`
CREATE TABLE IF NOT EXISTS crop_journey_notifications (
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
`);

// Create crop_care_schedule table for AI-generated water & fertilizer plan
db.run(`
CREATE TABLE IF NOT EXISTS crop_care_schedule (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  journey_id INTEGER NOT NULL,
  farmer_id INTEGER NOT NULL,
  care_type TEXT NOT NULL CHECK(care_type IN ('water', 'fertilizer')),
  planned_date TEXT NOT NULL,
  planned_day_from_sowing INTEGER DEFAULT NULL,
  quantity REAL DEFAULT NULL,
  quantity_unit TEXT DEFAULT 'liters',
  fertilizer_type TEXT DEFAULT NULL,
  reason TEXT DEFAULT NULL,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'completed', 'skipped')),
  completed_date TEXT DEFAULT NULL,
  notes TEXT DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (journey_id) REFERENCES crop_journey(id),
  FOREIGN KEY (farmer_id) REFERENCES farmers(id)
)
`);

db.serialize(() => {
  db.all("PRAGMA table_info(farmers)", (err, columns) => {
    if (err) {
      console.error("Error checking table schema:", err);
      return;
    }
    
    const columnNames = columns.map(col => col.name);
    
    // Add selected_crop column if it doesn't exist
    if (!columnNames.includes('selected_crop')) {
      db.run("ALTER TABLE farmers ADD COLUMN selected_crop TEXT DEFAULT NULL", (err) => {
        if (err) console.error("Error adding selected_crop column:", err);
        else console.log("✅ Added selected_crop column");
      });
    }
    
    // Add crop_locked column if it doesn't exist
    if (!columnNames.includes('crop_locked')) {
      db.run("ALTER TABLE farmers ADD COLUMN crop_locked INTEGER DEFAULT 0", (err) => {
        if (err) console.error("Error adding crop_locked column:", err);
        else console.log("✅ Added crop_locked column");
      });
    }
    
    // Add crop_selected_date column if it doesn't exist
    if (!columnNames.includes('crop_selected_date')) {
      db.run("ALTER TABLE farmers ADD COLUMN crop_selected_date TEXT DEFAULT NULL", (err) => {
        if (err) console.error("Error adding crop_selected_date column:", err);
        else console.log("✅ Added crop_selected_date column");
      });
    }

    // Add real-time weather columns if they don't exist
    if (!columnNames.includes('lastFetchedTemperature')) {
      db.run("ALTER TABLE farmers ADD COLUMN lastFetchedTemperature REAL DEFAULT NULL", (err) => {
        if (err) console.error("Error adding lastFetchedTemperature column:", err);
        else console.log("✅ Added lastFetchedTemperature column");
      });
    }

    if (!columnNames.includes('lastFetchedHumidity')) {
      db.run("ALTER TABLE farmers ADD COLUMN lastFetchedHumidity REAL DEFAULT NULL", (err) => {
        if (err) console.error("Error adding lastFetchedHumidity column:", err);
        else console.log("✅ Added lastFetchedHumidity column");
      });
    }

    if (!columnNames.includes('lastWeatherUpdate')) {
      db.run("ALTER TABLE farmers ADD COLUMN lastWeatherUpdate TEXT DEFAULT NULL", (err) => {
        if (err) console.error("Error adding lastWeatherUpdate column:", err);
        else console.log("✅ Added lastWeatherUpdate column");
      });
    }

    // Add crop_sowing_date column for storing the sowing date
    if (!columnNames.includes('crop_sowing_date')) {
      db.run("ALTER TABLE farmers ADD COLUMN crop_sowing_date TEXT DEFAULT NULL", (err) => {
        if (err) console.error("Error adding crop_sowing_date column:", err);
        else console.log("✅ Added crop_sowing_date column");
      });
    }

    // Add crop_sowing_date_locked column to prevent editing after lock
    if (!columnNames.includes('crop_sowing_date_locked')) {
      db.run("ALTER TABLE farmers ADD COLUMN crop_sowing_date_locked INTEGER DEFAULT 0", (err) => {
        if (err) console.error("Error adding crop_sowing_date_locked column:", err);
        else console.log("✅ Added crop_sowing_date_locked column");
      });
    }
  });

  // Check and add missing columns to crop_care_schedule table
  db.all("PRAGMA table_info(crop_care_schedule)", (err, columns) => {
    if (err) {
      console.error("Error checking crop_care_schedule schema:", err);
      return;
    }

    const columnNames = columns.map(col => col.name);

    // Add fertilizer_type column if it doesn't exist
    if (!columnNames.includes('fertilizer_type')) {
      db.run("ALTER TABLE crop_care_schedule ADD COLUMN fertilizer_type TEXT DEFAULT NULL", (err) => {
        if (err) console.error("Error adding fertilizer_type column:", err);
        else console.log("✅ Added fertilizer_type column to crop_care_schedule");
      });
    }
  });
});

module.exports = db;