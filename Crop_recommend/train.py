import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score
import joblib

# Load CSV dataset
data = pd.read_csv("Crop_data.csv")

# Remove extra spaces from column names
data.columns = data.columns.str.strip()

# Encode Soil Type
soil_encoder = LabelEncoder()
data["Soil Type"] = soil_encoder.fit_transform(data["Soil Type"])

# Encode Target (Recommended Crop)
crop_encoder = LabelEncoder()
data["Recommended Crop"] = crop_encoder.fit_transform(data["Recommended Crop"])

# Features
X = data[["Temperature", "Humidity", "Soil Type", "Water Availability"]]

# Target
y = data["Recommended Crop"]

# Split dataset
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# Train model
model = RandomForestClassifier(n_estimators=200)
model.fit(X_train, y_train)

# Test accuracy
y_pred = model.predict(X_test)
accuracy = accuracy_score(y_test, y_pred)

print("Model Accuracy:", accuracy)

# Save model
joblib.dump(model, "crop_model.pkl")
joblib.dump(soil_encoder, "soil_encoder.pkl")
joblib.dump(crop_encoder, "crop_encoder.pkl")

print("Model saved successfully!")