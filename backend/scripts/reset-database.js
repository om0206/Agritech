const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("./farmers.db", (err) => {
  if (err) {
    console.log("Database error:", err);
    process.exit(1);
  } else {
    console.log("Connected to SQLite database");
  }
});

// Drop the old table with plaintext passwords
db.run(`DROP TABLE IF EXISTS farmers`, (err) => {
  if (err) {
    console.log("Error dropping table:", err);
  } else {
    console.log("✓ Dropped old farmers table");
  }
});

// Create new table fresh (passwords will now be hashed with bcrypt)
db.run(`
CREATE TABLE IF NOT EXISTS farmers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  mobile TEXT,
  location TEXT,
  landSize TEXT,
  soilDetails TEXT,
  waterAvailabilityMm INTEGER,
  investment TEXT,
  selected_crop TEXT DEFAULT NULL,
  crop_locked INTEGER DEFAULT 0,
  crop_selected_date TEXT DEFAULT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
)
`, (err) => {
  if (err) {
    console.log("Error creating table:", err);
  } else {
    console.log("✓ Created fresh farmers table with proper structure");
    console.log("✓ waterAvailabilityMm stores mm values only");
    console.log("✓ Crop selection columns added (selected_crop, crop_locked, crop_selected_date)");
    console.log("\n✅ Database reset complete!");
    console.log("Now register new users - their passwords will be hashed with bcrypt\n");
  }
  db.close();
});
