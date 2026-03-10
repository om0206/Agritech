import joblib
import numpy as np

# Load saved model
model = joblib.load("crop_model.pkl")
soil_encoder = joblib.load("soil_encoder.pkl")
crop_encoder = joblib.load("crop_encoder.pkl")

# Input values
temperature = 35
humidity = 25
soil = "Sandy"
water = 1500

# Encode soil
soil_encoded = soil_encoder.transform([soil])[0]

# Prepare input
X = [[temperature, humidity, soil_encoded, water]]

# Get probability of each crop
probabilities = model.predict_proba(X)

# Get top 3 crops
top3_index = np.argsort(probabilities[0])[-3:]

# Convert index to crop name
top3_crops = crop_encoder.inverse_transform(top3_index)

print("Top 3 Recommended Crops:")
for crop in top3_crops[::-1]:
    print(crop)