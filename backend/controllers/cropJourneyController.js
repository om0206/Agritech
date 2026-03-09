const db = require("../database/database");

/**
 * Create or update a crop journey entry
 * When farmer locks a crop and sets sowing date, it goes to crop_journey table
 */
exports.saveCropJourney = (req, res) => {
  const { id } = req.params;
  const { cropName, sowingDate } = req.body;

  if (!cropName) {
    return res.status(400).json({ error: "Crop name is required" });
  }

  try {
    // Insert into crop_journey table
    const sql = `
      INSERT INTO crop_journey (farmer_id, crop_name, crop_sowing_date, crop_sowing_date_locked)
      VALUES (?, ?, ?, ?)
    `;

    const isLocked = sowingDate ? 1 : 0;
    
    db.run(
      sql,
      [id, cropName, sowingDate || null, isLocked],
      function (err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        console.log(`✅ Crop journey saved for farmer ${id}: ${cropName}`);
        res.json({
          message: "Crop journey recorded successfully",
          journeyId: this.lastID,
          farmerId: id,
          cropName: cropName,
          sowingDate: sowingDate,
          locked: isLocked === 1
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get crop journey history for a farmer
 * Shows all crops they've locked with their sowing dates
 */
exports.getCropJourney = (req, res) => {
  const { id } = req.params;

  const sql = `
    SELECT 
      id,
      crop_name,
      crop_sowing_date,
      crop_sowing_date_locked,
      created_at
    FROM crop_journey 
    WHERE farmer_id = ?
    ORDER BY created_at DESC
  `;

  db.all(sql, [id], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    res.json({
      farmerId: id,
      totalCropsTracked: rows ? rows.length : 0,
      cropHistory: rows || [],
      message: "Crop journey history retrieved successfully"
    });
  });
};

/**
 * Get current crop journey (latest entry)
 * For displaying on home page
 */
exports.getCurrentCropJourney = (req, res) => {
  const { id } = req.params;

  const sql = `
    SELECT 
      id,
      crop_name,
      crop_sowing_date,
      crop_sowing_date_locked,
      created_at
    FROM crop_journey 
    WHERE farmer_id = ?
    ORDER BY created_at DESC
    LIMIT 1
  `;

  db.get(sql, [id], (err, row) => {
    if (err) {
      console.error(`❌ Error fetching crop journey for farmer ${id}:`, err.message);
      return res.status(500).json({ error: err.message });
    }

    if (!row) {
      console.log(`⚠️ No crop journey found for farmer ${id}`);
      return res.status(404).json({ 
        message: "No crop journey found",
        farmerId: id 
      });
    }

    console.log(`✅ Fetched crop journey for farmer ${id}:`, row);
    res.json({
      farmerId: id,
      currentJourney: row,
      message: "Current crop journey retrieved successfully"
    });
  });
};

/**
 * Update sowing date in crop journey
 * Locks the sowing date for the latest crop entry
 */
exports.updateCropJourneySowingDate = (req, res) => {
  const { id } = req.params;
  const { sowingDate } = req.body;

  if (!sowingDate) {
    return res.status(400).json({ error: "Sowing date is required" });
  }

  try {
    // Get the latest crop journey entry
    const getLatestSql = `
      SELECT id 
      FROM crop_journey 
      WHERE farmer_id = ?
      ORDER BY created_at DESC
      LIMIT 1
    `;

    db.get(getLatestSql, [id], (err, row) => {
      if (err) {
        console.error(`❌ Error finding crop journey for farmer ${id}:`, err.message);
        return res.status(500).json({ error: err.message });
      }

      if (!row) {
        console.warn(`⚠️ No crop journey found for farmer ${id}`);
        return res.status(404).json({ message: "No crop journey found for this farmer" });
      }

      // Update the sowing date and lock it
      const updateSql = `
        UPDATE crop_journey 
        SET crop_sowing_date = ?, crop_sowing_date_locked = 1
        WHERE id = ?
      `;

      db.run(updateSql, [sowingDate, row.id], function (err) {
        if (err) {
          console.error(`❌ Error updating sowing date for journey ${row.id}:`, err.message);
          return res.status(500).json({ error: err.message });
        }

        console.log(`✅ Sowing date set for crop journey ${row.id}: ${sowingDate}`);
        res.json({
          message: "Sowing date saved and locked successfully",
          cropJourneyId: row.id,
          sowingDate: sowingDate,
          locked: true
        });
      });
    });
  } catch (error) {
    console.error(`❌ Unexpected error in updateCropJourneySowingDate:`, error.message);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Delete a crop journey entry (in case farmer wants to remove old records)
 */
exports.deleteCropJourney = (req, res) => {
  const { id, journeyId } = req.params;

  const sql = "DELETE FROM crop_journey WHERE id = ? AND farmer_id = ?";

  db.run(sql, [journeyId, id], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (this.changes === 0) {
      return res.status(404).json({ message: "Crop journey entry not found" });
    }

    res.json({
      message: "Crop journey entry deleted successfully",
      journeyId: journeyId
    });
  });
};
