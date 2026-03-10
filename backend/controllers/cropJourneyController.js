const db = require("../database/database");
const groqService = require("../services/groqCropPlanService");

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

/**
 * Add water log for a crop journey
 * Records when water was applied to the crop
 */
exports.addWaterLog = (req, res) => {
  const { id, journeyId } = req.params;
  const { quantity, logDate, notes } = req.body;

  if (!logDate) {
    return res.status(400).json({ error: "Log date is required" });
  }

  const sql = `
    INSERT INTO crop_journey_logs (journey_id, farmer_id, log_type, quantity, log_date, notes)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.run(
    sql,
    [journeyId, id, 'water', quantity || null, logDate, notes || null],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      console.log(`✅ Water log added for journey ${journeyId}`);
      res.json({
        message: "Water log recorded successfully",
        logId: this.lastID,
        journeyId: journeyId,
        quantity: quantity,
        logDate: logDate
      });
    }
  );
};

/**
 * Add fertilizer log for a crop journey
 * Records when fertilizer was applied to the crop
 */
exports.addFertilizerLog = (req, res) => {
  const { id, journeyId } = req.params;
  const { quantity, logDate, notes } = req.body;

  if (!logDate) {
    return res.status(400).json({ error: "Log date is required" });
  }

  const sql = `
    INSERT INTO crop_journey_logs (journey_id, farmer_id, log_type, quantity, log_date, notes)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.run(
    sql,
    [journeyId, id, 'fertilizer', quantity || null, logDate, notes || null],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      console.log(`✅ Fertilizer log added for journey ${journeyId}`);
      res.json({
        message: "Fertilizer log recorded successfully",
        logId: this.lastID,
        journeyId: journeyId,
        quantity: quantity,
        logDate: logDate
      });
    }
  );
};

/**
 * Get all logs (water & fertilizer) for a crop journey
 */
exports.getCropJourneyLogs = (req, res) => {
  const { id, journeyId } = req.params;

  const sql = `
    SELECT 
      id,
      log_type,
      quantity,
      log_date,
      notes,
      created_at
    FROM crop_journey_logs 
    WHERE journey_id = ? AND farmer_id = ?
    ORDER BY log_date DESC
  `;

  db.all(sql, [journeyId, id], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    // Separate water and fertilizer logs
    const waterLogs = rows ? rows.filter(log => log.log_type === 'water') : [];
    const fertilizerLogs = rows ? rows.filter(log => log.log_type === 'fertilizer') : [];

    res.json({
      journeyId: journeyId,
      totalLogs: rows ? rows.length : 0,
      waterLogs: waterLogs,
      fertilizerLogs: fertilizerLogs,
      allLogs: rows || [],
      message: "Crop journey logs retrieved successfully"
    });
  });
};

/**
 * Create a notification reminder for water or fertilizer
 */
exports.createNotification = (req, res) => {
  const { id, journeyId } = req.params;
  const { notificationType, scheduledDate, scheduledTime, message } = req.body;

  if (!notificationType || !scheduledDate) {
    return res.status(400).json({ error: "Notification type and scheduled date are required" });
  }

  const sql = `
    INSERT INTO crop_journey_notifications (farmer_id, journey_id, notification_type, scheduled_date, scheduled_time, message, is_sent)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  db.run(
    sql,
    [id, journeyId, notificationType, scheduledDate, scheduledTime || null, message || '', 0],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      console.log(`✅ Notification created for journey ${journeyId}`);
      res.json({
        message: "Notification scheduled successfully",
        notificationId: this.lastID,
        journeyId: journeyId,
        scheduledDate: scheduledDate,
        notificationType: notificationType
      });
    }
  );
};

/**
 * Get pending notifications for a farmer
 */
exports.getPendingNotifications = (req, res) => {
  const { id } = req.params;

  const sql = `
    SELECT 
      id,
      journey_id,
      notification_type,
      scheduled_date,
      scheduled_time,
      message,
      is_sent,
      created_at
    FROM crop_journey_notifications 
    WHERE farmer_id = ? AND is_sent = 0
    ORDER BY scheduled_date ASC
  `;

  db.all(sql, [id], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    res.json({
      farmerId: id,
      totalPendingNotifications: rows ? rows.length : 0,
      notifications: rows || [],
      message: "Pending notifications retrieved successfully"
    });
  });
};

/**
 * Mark notification as sent
 */
exports.markNotificationAsSent = (req, res) => {
  const { id, notificationId } = req.params;

  const sql = `
    UPDATE crop_journey_notifications 
    SET is_sent = 1, sent_at = CURRENT_TIMESTAMP
    WHERE id = ? AND farmer_id = ?
  `;

  db.run(sql, [notificationId, id], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (this.changes === 0) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.json({
      message: "Notification marked as sent",
      notificationId: notificationId
    });
  });
};

/**
 * Get complete crop journey with all logs and activity
 */
exports.getCompleteJourneyWithLogs = (req, res) => {
  const { id, journeyId } = req.params;

  // Get journey details
  const journeySQL = `
    SELECT id, crop_name, crop_sowing_date, created_at 
    FROM crop_journey 
    WHERE id = ? AND farmer_id = ?
  `;

  db.get(journeySQL, [journeyId, id], (err, journey) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (!journey) {
      return res.status(404).json({ message: "Journey not found" });
    }

    // Get logs for this journey
    const logsSQL = `
      SELECT id, log_type, quantity, log_date, notes, created_at 
      FROM crop_journey_logs 
      WHERE journey_id = ? 
      ORDER BY log_date DESC
    `;

    db.all(logsSQL, [journeyId], (err, logs) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      // Get notifications for this journey
      const notifSQL = `
        SELECT id, notification_type, scheduled_date, scheduled_time, message, is_sent 
        FROM crop_journey_notifications 
        WHERE journey_id = ? 
        ORDER BY scheduled_date ASC
      `;

      db.all(notifSQL, [journeyId], (err, notifications) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        res.json({
          message: "Complete journey data retrieved successfully",
          journey: journey,
          logs: logs || [],
          waterLogs: (logs || []).filter(l => l.log_type === 'water'),
          fertilizerLogs: (logs || []).filter(l => l.log_type === 'fertilizer'),
          notifications: notifications || []
        });
      });
    });
  });
};

/**
 * Generate crop care plan using Groq AI
 * Creates watering and fertilizer schedule for entire crop journey
 */
exports.generateCropCarePlan = async (req, res) => {
  const { id, journeyId } = req.params;

  try {
    // Get journey details
    const journeySQL = `
      SELECT cj.id, cj.crop_name, cj.crop_sowing_date, f.soilDetails, f.waterAvailabilityMm, f.landSize, f.location
      FROM crop_journey cj
      JOIN farmers f ON cj.farmer_id = f.id
      WHERE cj.id = ? AND cj.farmer_id = ?
    `;

    db.get(journeySQL, [journeyId, id], async (err, journey) => {
      if (err) {
        console.error('❌ Error fetching journey:', err);
        return res.status(500).json({ error: err.message });
      }

      if (!journey) {
        return res.status(404).json({ message: "Journey not found" });
      }

      try {
        console.log('🤖 Generating crop care plan for:', journey.crop_name);
        
        // Generate plan using Groq
        const plan = await groqService.generateCropCarePlan(
          journey,
          journey.crop_name,
          journey.crop_sowing_date
        );

        // Save plan to database
        await groqService.saveCropCarePlan(journeyId, id, plan);

        // Create notifications for each planned task
        const createNotifications = () => {
          return new Promise((resolve, reject) => {
            const allTasks = [
              ...plan.watering_schedule.map(w => ({
                type: 'water',
                date: w.planned_date,
                message: `💧 Water your ${journey.crop_name} crop. Quantity: ${w.quantity} ${w.unit}`
              })),
              ...plan.fertilizer_schedule.map(f => ({
                type: 'fertilizer',
                date: f.planned_date,
                message: `🌱 Apply fertilizer to your ${journey.crop_name} crop. Quantity: ${f.quantity} ${f.unit}`
              }))
            ];

            let completed = 0;
            allTasks.forEach(task => {
              const notifSQL = `
                INSERT INTO crop_journey_notifications 
                (farmer_id, journey_id, notification_type, scheduled_date, scheduled_time, message, is_sent)
                VALUES (?, ?, ?, ?, ?, ?, ?)
              `;

              db.run(
                notifSQL,
                [id, journeyId, task.type, task.date, '09:00', task.message, 0],
                (notifErr) => {
                  completed++;
                  if (notifErr) console.error('Error creating notification:', notifErr);
                  if (completed === allTasks.length) resolve();
                }
              );
            });
          });
        };

        await createNotifications();

        res.json({
          message: "Crop care plan generated successfully!",
          cropName: journey.crop_name,
          sowingDate: journey.crop_sowing_date,
          cropDuration: plan.crop_duration_days,
          watering_tasks: plan.watering_schedule.length,
          fertilizer_tasks: plan.fertilizer_schedule.length,
          total_tasks: plan.watering_schedule.length + plan.fertilizer_schedule.length,
          plan: plan,
          notes: plan.notes
        });
      } catch (planError) {
        console.error('❌ Error generating plan:', planError);
        res.status(500).json({ error: 'Failed to generate crop plan: ' + planError.message });
      }
    });
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get crop care schedule (planned watering and fertilizer)
 */
exports.getCropCareSchedule = (req, res) => {
  const { id, journeyId } = req.params;

  const sql = `
    SELECT 
      id,
      care_type,
      planned_date,
      planned_day_from_sowing,
      quantity,
      quantity_unit,
      fertilizer_type,
      reason,
      status,
      completed_date,
      notes
    FROM crop_care_schedule 
    WHERE journey_id = ? AND farmer_id = ?
    ORDER BY planned_date ASC
  `;

  db.all(sql, [journeyId, id], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    const watering = rows ? rows.filter(r => r.care_type === 'water') : [];
    const fertilizer = rows ? rows.filter(r => r.care_type === 'fertilizer') : [];
    const completed = rows ? rows.filter(r => r.status === 'completed').length : 0;
    const pending = rows ? rows.filter(r => r.status === 'pending').length : 0;

    res.json({
      journeyId: journeyId,
      watering_schedule: watering,
      fertilizer_schedule: fertilizer,
      all_schedule: rows || [],
      stats: {
        total_tasks: rows ? rows.length : 0,
        completed_tasks: completed,
        pending_tasks: pending,
        completion_percentage: rows && rows.length > 0 ? Math.round((completed / rows.length) * 100) : 0
      },
      message: "Crop care schedule retrieved successfully"
    });
  });
};

/**
 * Mark a scheduled task as completed
 */
exports.markTaskCompleted = (req, res) => {
  const { id, taskId } = req.params;

  const sql = `
    UPDATE crop_care_schedule 
    SET status = 'completed', completed_date = CURRENT_DATE
    WHERE id = ? AND farmer_id = ?
  `;

  db.run(sql, [taskId, id], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (this.changes === 0) {
      return res.status(404).json({ message: "Task not found" });
    }

    console.log(`✅ Task ${taskId} marked as completed for farmer ${id}`);
    res.json({
      message: "Task marked as completed",
      taskId: taskId,
      status: 'completed'
    });
  });
};

/**
 * Mark a scheduled task as skipped
 */
exports.skipTask = (req, res) => {
  const { id, taskId } = req.params;

  const sql = `
    UPDATE crop_care_schedule 
    SET status = 'skipped'
    WHERE id = ? AND farmer_id = ?
  `;

  db.run(sql, [taskId, id], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (this.changes === 0) {
      return res.status(404).json({ message: "Task not found" });
    }

    console.log(`⏭️ Task ${taskId} marked as skipped for farmer ${id}`);
    res.json({
      message: "Task marked as skipped",
      taskId: taskId,
      status: 'skipped'
    });
  });
};
