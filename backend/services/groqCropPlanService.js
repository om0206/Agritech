const axios = require('axios');
const db = require('../database/database');

const GROQ_API_KEY = process.env.GROQ_API_KEY || 'your_groq_api_key_here';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

/**
 * Generate crop care plan using Groq AI
 * Creates a watering and fertilizer schedule for the entire crop journey
 */
exports.generateCropCarePlan = async (farmerData, cropName, sowingDate) => {
  try {
    if (!GROQ_API_KEY || GROQ_API_KEY === 'your_groq_api_key_here') {
      console.warn('⚠️  GROQ_API_KEY not configured. Using default plan.');
      return generateDefaultPlan(cropName, sowingDate);
    }

    const prompt = `
You are an agricultural expert. Generate a detailed watering and fertilizer plan for a crop.

CROP DETAILS:
- Crop Name: ${cropName}
- Sowing Date: ${sowingDate}
- Soil Type: ${farmerData.soilDetails || 'Unknown'}
- Water Availability: ${farmerData.waterAvailabilityMm || 'Unknown'} mm
- Land Size: ${farmerData.landSize || 'Unknown'}
- Location: ${farmerData.location || 'Unknown'}

Please provide:
1. A WATERING SCHEDULE - response in JSON format with watering dates and quantities
2. A FERTILIZER SCHEDULE - response in JSON format with fertilizer dates and types

Format your response as valid JSON only, with NO other text:
{
  "watering_schedule": [
    {
      "day_from_sowing": 10,
      "planned_date": "YYYY-MM-DD",
      "quantity": 50,
      "unit": "liters",
      "reason": "Initial watering after germination"
    }
  ],
  "fertilizer_schedule": [
    {
      "day_from_sowing": 15,
      "planned_date": "YYYY-MM-DD",
      "quantity": 15,
      "unit": "kg",
      "type": "NPK 10-10-10",
      "reason": "First nutrition boost for growth"
    }
  ],
  "crop_duration_days": 120,
  "notes": "General care instructions"
}

Generate a realistic plan for ${cropName} based on typical agricultural practices.
    `;

    console.log('🤖 Calling Groq API to generate crop plan...');

    const response = await axios.post(
      GROQ_API_URL,
      {
        model: 'llama-3.1-8b-instant',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 1500,
      },
      {
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    if (!response.data || !response.data.choices || !response.data.choices[0]) {
      console.error('❌ Invalid Groq API response format:', response.status);
      return generateDefaultPlan(cropName, sowingDate);
    }

    const content = response.data.choices[0].message.content;
    console.log('✅ Groq API Response received');
    console.log('Raw response (first 300 chars):', content.substring(0, 300));

    // Parse JSON response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.warn('⚠️ Could not extract JSON from Groq response. Using default plan.');
      console.log('Response content:', content.substring(0, 200));
      return generateDefaultPlan(cropName, sowingDate);
    }

    const plan = JSON.parse(jsonMatch[0]);
    console.log('✅ Crop plan parsed successfully');
    console.log('📋 Plan structure:');
    console.log('  - Watering tasks:', plan.watering_schedule?.length || 0);
    console.log('  - Fertilizer tasks:', plan.fertilizer_schedule?.length || 0);
    if (plan.fertilizer_schedule && plan.fertilizer_schedule.length > 0) {
      console.log('  - Sample fertilizer:', JSON.stringify(plan.fertilizer_schedule[0]));
    }

    return plan;
  } catch (error) {
    console.error('❌ Error calling Groq API:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response headers:', error.response.headers);
      console.error('Response data (first 500 chars):', 
        typeof error.response.data === 'string' 
          ? error.response.data.substring(0, 500)
          : JSON.stringify(error.response.data).substring(0, 500)
      );
    }
    console.log('⚠️  Falling back to default plan...');
    return generateDefaultPlan(cropName, sowingDate);
  }
};

/**
 * Default crop care plan if Groq API is not available
 * Generates typical plans based on crop type
 */
function generateDefaultPlan(cropName, sowingDate) {
  const sowDate = new Date(sowingDate);
  const cropLower = cropName.toLowerCase();

  // Map common crops to their care schedules
  const cropPlans = {
    wheat: {
      duration: 120,
      watering: [
        { day: 20, qty: 40, reason: 'Post-germination watering' },
        { day: 45, qty: 50, reason: 'During tillering stage' },
        { day: 75, qty: 45, reason: 'Boot stage watering' },
        { day: 95, qty: 35, reason: 'Grain filling stage' },
      ],
      fertilizer: [
        { day: 25, qty: 20, type: 'Urea (46-0-0)', reason: 'First top dressing for growth' },
        { day: 60, qty: 25, type: 'NPK (10-10-10)', reason: 'Second nutrition boost' },
      ],
    },
    rice: {
      duration: 135,
      watering: [
        { day: 15, qty: 50, reason: 'Flooding for transplanting' },
        { day: 30, qty: 60, reason: 'Maintenance flooding' },
        { day: 60, qty: 55, reason: 'Mid-season flooding' },
        { day: 90, qty: 45, reason: 'Panicle initiation stage' },
        { day: 110, qty: 30, reason: 'Drying for ripening' },
      ],
      fertilizer: [
        { day: 20, qty: 30, type: 'DAP or NPK', reason: 'Basal dressing' },
        { day: 45, qty: 25, type: 'Urea (46-0-0)', reason: 'Split application for growth' },
        { day: 75, qty: 20, type: 'Potash', reason: 'Grain development' },
      ],
    },
    cotton: {
      duration: 180,
      watering: [
        { day: 25, qty: 35, reason: 'Early growth stage' },
        { day: 50, qty: 45, reason: 'Flowering initiation' },
        { day: 80, qty: 55, reason: 'Peak flowering' },
        { day: 120, qty: 50, reason: 'Boll development' },
        { day: 150, qty: 40, reason: 'Boll maturation' },
      ],
      fertilizer: [
        { day: 30, qty: 40, type: 'NPK (10-26-26)', reason: 'Initial nutrition' },
        { day: 70, qty: 35, type: 'Urea (46-0-0)', reason: 'Mid-season boost' },
        { day: 100, qty: 30, type: 'Potash', reason: 'Flower and boll development' },
      ],
    },
    corn: {
      duration: 110,
      watering: [
        { day: 20, qty: 45, reason: 'Early vegetative growth' },
        { day: 50, qty: 60, reason: 'Tassel stage' },
        { day: 75, qty: 55, reason: 'Silking and pollination' },
        { day: 95, qty: 40, reason: 'Grain filling' },
      ],
      fertilizer: [
        { day: 25, qty: 30, type: 'Urea (46-0-0)', reason: 'Growth promotion' },
        { day: 60, qty: 25, type: 'NPK (0-0-50)', reason: 'Potash for pollination' },
      ],
    },
    sugarcane: {
      duration: 300,
      watering: [
        { day: 30, qty: 50, reason: 'Post-planting' },
        { day: 60, qty: 55, reason: 'Germination stage' },
        { day: 100, qty: 65, reason: 'Tillering stage' },
        { day: 180, qty: 75, reason: 'Stem elongation' },
        { day: 240, qty: 60, reason: 'Maturation' },
      ],
      fertilizer: [
        { day: 45, qty: 100, type: 'FYM or Compost', reason: 'Basal dressing' },
        { day: 75, qty: 40, type: 'Urea (46-0-0)', reason: 'First split' },
        { day: 150, qty: 40, type: 'Urea (46-0-0)', reason: 'Second split' },
      ],
    },
  };

  // Find matching crop plan or use default
  let plan = null;
  for (const [key, value] of Object.entries(cropPlans)) {
    if (cropLower.includes(key)) {
      plan = value;
      break;
    }
  }

  // Default plan if crop not found
  if (!plan) {
    plan = {
      duration: 120,
      watering: [
        { day: 20, qty: 40, reason: 'Early growth stage' },
        { day: 50, qty: 50, reason: 'Mid-growth stage' },
        { day: 85, qty: 45, reason: 'Maturation stage' },
      ],
      fertilizer: [
        { day: 25, qty: 20, type: 'NPK (10-10-10)', reason: 'Growth promotion' },
        { day: 65, qty: 20, type: 'Urea (46-0-0)', reason: 'Nutrient boost' },
      ],
    };
  }

  // Convert day-based schedule to actual dates
  const wateringSchedule = plan.watering.map((w) => {
    const plannedDate = new Date(sowDate);
    plannedDate.setDate(plannedDate.getDate() + w.day);
    return {
      day_from_sowing: w.day,
      planned_date: plannedDate.toISOString().split('T')[0],
      quantity: w.qty,
      unit: 'liters',
      reason: w.reason,
    };
  });

  const fertilizerSchedule = plan.fertilizer.map((f) => {
    const plannedDate = new Date(sowDate);
    plannedDate.setDate(plannedDate.getDate() + f.day);
    return {
      day_from_sowing: f.day,
      planned_date: plannedDate.toISOString().split('T')[0],
      quantity: f.qty,
      unit: 'kg',
      type: f.type,
      reason: f.reason,
    };
  });

  return {
    watering_schedule: wateringSchedule,
    fertilizer_schedule: fertilizerSchedule,
    crop_duration_days: plan.duration,
    notes: `Default plan for ${cropName}. Adjust based on local conditions.`,
  };
}

/**
 * Save generated crop care plan to database
 */
exports.saveCropCarePlan = (journeyId, farmerId, plan) => {
  return new Promise((resolve, reject) => {
    try {
      // Insert watering schedule
      const wateringPromises = plan.watering_schedule.map((water) => {
        return new Promise((resolveWater, rejectWater) => {
          const sql = `
            INSERT INTO crop_care_schedule 
            (journey_id, farmer_id, care_type, planned_date, planned_day_from_sowing, quantity, quantity_unit, reason, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `;

          db.run(
            sql,
            [
              journeyId,
              farmerId,
              'water',
              water.planned_date,
              water.day_from_sowing,
              water.quantity,
              water.unit,
              water.reason,
              'pending',
            ],
            function (err) {
              if (err) rejectWater(err);
              else {
                console.log(`✅ Water schedule saved: Day ${water.day_from_sowing}`);
                resolveWater(this.lastID);
              }
            }
          );
        });
      });

      // Insert fertilizer schedule
      const fertilizerPromises = plan.fertilizer_schedule.map((fert) => {
        return new Promise((resolveFert, rejectFert) => {
          // Support multiple field names for fertilizer type
          const fertilizerType = fert.type || fert.fertilizer_type || fert.fertilizer || null;
          
          const sql = `
            INSERT INTO crop_care_schedule 
            (journey_id, farmer_id, care_type, planned_date, planned_day_from_sowing, quantity, quantity_unit, fertilizer_type, reason, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `;

          db.run(
            sql,
            [
              journeyId,
              farmerId,
              'fertilizer',
              fert.planned_date,
              fert.day_from_sowing,
              fert.quantity,
              fert.unit,
              fertilizerType,
              fert.reason,
              'pending',
            ],
            function (err) {
              if (err) rejectFert(err);
              else {
                console.log(`✅ Fertilizer schedule saved: Day ${fert.day_from_sowing} - ${fertilizerType}`);
                resolveFert(this.lastID);
              }
            }
          );
        });
      });

      Promise.all([...wateringPromises, ...fertilizerPromises])
        .then(() => {
          console.log('✅ Complete crop care plan saved to database');
          resolve();
        })
        .catch((err) => {
          console.error('❌ Error saving crop plan:', err);
          reject(err);
        });
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Get crop care schedule for a journey
 */
exports.getCropCareSchedule = (journeyId, farmerId) => {
  return new Promise((resolve, reject) => {
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

    db.all(sql, [journeyId, farmerId], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        const watering = rows ? rows.filter((r) => r.care_type === 'water') : [];
        const fertilizer = rows ? rows.filter((r) => r.care_type === 'fertilizer') : [];
        
        resolve({
          watering_schedule: watering,
          fertilizer_schedule: fertilizer,
          all_schedule: rows || [],
          total_tasks: rows ? rows.length : 0,
          completed_tasks: rows ? rows.filter((r) => r.status === 'completed').length : 0,
          pending_tasks: rows ? rows.filter((r) => r.status === 'pending').length : 0,
        });
      }
    });
  });
};

/**
 * Mark a scheduled task as completed
 */
exports.markTaskCompleted = (scheduleId, farmerId) => {
  return new Promise((resolve, reject) => {
    const sql = `
      UPDATE crop_care_schedule 
      SET status = 'completed', completed_date = CURRENT_DATE
      WHERE id = ? AND farmer_id = ?
    `;

    db.run(sql, [scheduleId, farmerId], function (err) {
      if (err) {
        reject(err);
      } else if (this.changes === 0) {
        reject(new Error('Schedule entry not found'));
      } else {
        console.log(`✅ Task marked as completed: ${scheduleId}`);
        resolve({ scheduleId, status: 'completed' });
      }
    });
  });
};

module.exports = exports;
