const db = require("../database/database");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { getWaterAvailabilityMm, getAllWaterAvailabilityOptions, getLabelFromMm } = require("../constants/waterAvailability");

const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET || "your_secret_key_change_this_in_production";

exports.signup = async (req, res) => {
  const {
    username,
    email,
    password,
    mobile,
    location,
    landSize,
    soilDetails,
    waterAvailability,
    investment
  } = req.body;

  try {
    // 1. Hash the password before saving it
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // 2. Get the mm value for the selected water availability option
    const waterAvailabilityMm = getWaterAvailabilityMm(waterAvailability);

    const sql = `
    INSERT INTO farmers 
    (username,email,password,mobile,location,landSize,soilDetails,waterAvailabilityMm,investment)
    VALUES (?,?,?,?,?,?,?,?,?)
    `;

    // 3. Save farmer with mm value only
    db.run(
      sql,
      [username, email, hashedPassword, mobile, location, landSize, soilDetails, waterAvailabilityMm, investment],
      function (err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        res.json({
          message: "Farmer registered successfully",
          id: this.lastID,
          waterAvailabilityMm: waterAvailabilityMm
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error: "Error encrypting password" });
  }
};

exports.login = (req, res) => {
  const { email, password } = req.body;

  // 1. Find the user by their email ONLY first
  const sql = "SELECT * FROM farmers WHERE email=?";

  db.get(sql, [email], async (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    // If no user is found with that email
    if (!row) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    try {
      // 2. Compare the typed password with the hashed password in the DB
      const match = await bcrypt.compare(password, row.password);

      if (match) {
        // Generate JWT token
        const token = jwt.sign(
          { id: row.id, email: row.email, username: row.username },
          JWT_SECRET,
          { expiresIn: "7d" }
        );

        // Remove the password from the object before sending it to the frontend
        delete row.password;
        
        // Convert waterAvailabilityMm back to waterAvailability label for frontend
        row.waterAvailability = getLabelFromMm(row.waterAvailabilityMm);
        
        res.json({
          message: "Login successful",
          token: token,
          farmer: row
        });
      } else {
        return res.status(401).json({ message: "Invalid credentials" });
      }
    } catch (error) {
      res.status(500).json({ error: "Error verifying password" });
    }
  });
};

exports.updateProfile = (req, res) => {
  const { id } = req.params;
  const {
    username,
    mobile,
    location,
    landSize,
    soilDetails,
    waterAvailability,
    investment
  } = req.body;

  try {
    // Build UPDATE query dynamically - only update fields that are provided
    const updates = [];
    const values = [];

    if (username !== undefined) {
      updates.push("username = ?");
      values.push(username);
    }
    if (mobile !== undefined) {
      updates.push("mobile = ?");
      values.push(mobile);
    }
    if (location !== undefined) {
      updates.push("location = ?");
      values.push(location);
    }
    if (landSize !== undefined) {
      updates.push("landSize = ?");
      values.push(landSize);
    }
    if (soilDetails !== undefined) {
      updates.push("soilDetails = ?");
      values.push(soilDetails);
    }
    if (waterAvailability !== undefined) {
      // Update only the mm value
      const waterAvailabilityMm = getWaterAvailabilityMm(waterAvailability);
      updates.push("waterAvailabilityMm = ?");
      values.push(waterAvailabilityMm);
    }
    if (investment !== undefined) {
      updates.push("investment = ?");
      values.push(investment);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: "No fields to update" });
    }

    // Add the ID at the end
    values.push(id);

    const sql = `UPDATE farmers SET ${updates.join(", ")} WHERE id = ?`;

    db.run(sql, values, function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (this.changes === 0) {
        return res.status(404).json({ message: "Farmer not found" });
      }

      res.json({
        message: "Profile updated successfully",
        changes: this.changes
      });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getProfile = (req, res) => {
  const { id } = req.params;

  const sql = "SELECT * FROM farmers WHERE id = ?";

  db.get(sql, [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (!row) {
      return res.status(404).json({ message: "Farmer not found" });
    }

    // Remove password before sending
    delete row.password;
    
    // Convert waterAvailabilityMm back to waterAvailability label for frontend
    row.waterAvailability = getLabelFromMm(row.waterAvailabilityMm);

    res.json(row);
  });
};

exports.getWaterAvailabilityOptions = (req, res) => {
  try {
    const options = getAllWaterAvailabilityOptions();
    res.json({
      message: "Water availability options retrieved successfully",
      options: options
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Save sowing date for the locked crop
 * @param {number} id - Farmer ID
 * @param {string} sowingDate - ISO date string (YYYY-MM-DD)
 */
exports.saveSowingDate = (req, res) => {
  const { id } = req.params;
  const { sowingDate } = req.body;

  if (!sowingDate) {
    return res.status(400).json({ error: "Sowing date is required" });
  }

  try {
    // First check if farmer exists and crop is locked
    const getFarmerSql = "SELECT crop_locked, crop_sowing_date_locked FROM farmers WHERE id = ?";
    db.get(getFarmerSql, [id], (err, farmer) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (!farmer) {
        return res.status(404).json({ message: "Farmer not found" });
      }

      if (!farmer.crop_locked) {
        return res.status(400).json({ error: "Crop must be locked before setting sowing date" });
      }

      // If sowing date is already locked, don't allow changes
      if (farmer.crop_sowing_date_locked) {
        return res.status(400).json({ error: "Sowing date is already locked and cannot be changed" });
      }

      // Save the sowing date and lock it
      const updateSql = "UPDATE farmers SET crop_sowing_date = ?, crop_sowing_date_locked = 1 WHERE id = ?";
      db.run(updateSql, [sowingDate, id], function (err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        console.log(`✅ Sowing date set for farmer ${id}: ${sowingDate}`);
        res.json({
          message: "Sowing date saved and locked successfully",
          sowingDate: sowingDate,
          locked: true
        });
      });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get sowing date for a farmer
 * @param {number} id - Farmer ID
 */
exports.getSowingDate = (req, res) => {
  const { id } = req.params;

  const sql = "SELECT crop_sowing_date, crop_sowing_date_locked FROM farmers WHERE id = ?";
  db.get(sql, [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (!row) {
      return res.status(404).json({ message: "Farmer not found" });
    }

    res.json({
      sowingDate: row.crop_sowing_date,
      isLocked: row.crop_sowing_date_locked ? true : false
    });
  });
};
