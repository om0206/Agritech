# 🤖 Model Saving Guide

Your crop recommendation system is now **configured to use your trained models directly** - no more hardcoded if-else fallback logic!

## ✅ What Changed

- **Removed:** Mock model with hardcoded temperature/water rules
- **Removed:** Fallback logic that returned fake predictions
- **Now:** System requires **real trained sklearn models** only

## 📋 What You Need to Do

### Step 1: Locate Your Training Code
Find your Jupyter Notebook or Python script where you trained the models. It should contain:

```python
# Your trained models after training
crop_model          # sklearn classifier (RandomForest, SVM, KNN, etc.)
soil_encoder        # LabelEncoder for soil types
crop_encoder        # LabelEncoder for crop names
```

### Step 2: Save Models with Proper Protocol
Add this code **after training** to save your models:

```python
import pickle
import os

# After training your models:
model_dir = "Crop_recommend"
os.makedirs(model_dir, exist_ok=True)

# Save with HIGHEST_PROTOCOL for compatibility
with open(os.path.join(model_dir, "crop_model.pkl"), "wb") as f:
    pickle.dump(crop_model, f, protocol=pickle.HIGHEST_PROTOCOL)

with open(os.path.join(model_dir, "soil_encoder.pkl"), "wb") as f:
    pickle.dump(soil_encoder, f, protocol=pickle.HIGHEST_PROTOCOL)

with open(os.path.join(model_dir, "crop_encoder.pkl"), "wb") as f:
    pickle.dump(crop_encoder, f, protocol=pickle.HIGHEST_PROTOCOL)

print("✅ Models saved successfully!")
```

### Step 3: Verify Model Files Exist
Check that these files exist in your `Crop_recommend/` folder:
- ✓ crop_model.pkl
- ✓ soil_encoder.pkl  
- ✓ crop_encoder.pkl

### Step 4: Test the Application
```bash
# Terminal 1: Start backend
cd backend
npm install
npm start

# Terminal 2: Test API
curl "http://localhost:5000/farmers/1/crop-recommendations"
```

## 🔍 Expected Model Format

Your trained model should have:
- **Input:** `[temperature, humidity, soil_encoded, water_availability]`
- **Output:** Probability distribution over crop classes
- **Required methods:**
  - `model.predict_proba(features)` - Returns probability for each crop
  - `model.classes_` - List of crop class names
  - `soil_encoder.transform(["soil_name"])` - Encodes soil to number

### Example: If using RandomForest
```python
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder

# Your training process
crop_model = RandomForestClassifier(n_estimators=100, random_state=42)
crop_model.fit(X_train, y_train)

soil_encoder = LabelEncoder()
soil_encoder.fit(["Loamy Soil", "Clay", "Sandy", "Alluvial", "Black Soil"])

crop_encoder = LabelEncoder()
crop_encoder.fit(["Rice", "Wheat", "Sugarcane", "Maize", "Cotton", "Groundnut", "Pulses"])

# Save models
# ... use Step 2 code above ...
```

## ❌ Troubleshooting

**Error: "Failed to load: crop_model"**
- → Model file doesn't exist or is corrupted
- → Re-save using Step 2 code above

**Error: "Invalid soil type"**
- → Soil type not in training data
- → Update soil_encoder to include all soil types

**Error: "Prediction failed"**
- → Model format incompatible
- → Ensure model has `predict_proba()` method
- → Ensure model was trained with sklearn

## 📂 File Structure
```
Loop/
├── Crop_recommend/
│   ├── crop_model.pkl        ← Your trained classifier
│   ├── soil_encoder.pkl      ← Soil type encoder
│   └── crop_encoder.pkl      ← Crop name encoder
├── backend/
│   ├── services/
│   │   └── cropRecommendationService.py   (loads models here)
│   ├── scripts/
│   │   └── save_model_template.py         (template for saving)
│   └── server.js
└── Agritech-Frontend/
```

## 🚀 Next Steps

1. ✅ Find your training code
2. ✅ Add model saving code (Step 2)
3. ✅ Re-run training to save models
4. ✅ Verify .pkl files exist
5. ✅ Restart backend and test

Once models are saved, the system will:
- ✅ Load your real trained models
- ✅ Use actual ML predictions (not hardcoded rules)
- ✅ Return 3 recommended crops based on learned patterns
- ✅ Show confidence scores based on model probabilities

---

**Questions?** Check the backend logs for detailed errors when loading models.
