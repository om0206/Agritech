"""
Proper Model Saving Template
Use this script to save your trained sklearn models correctly
"""

import pickle
import os

def save_trained_models(crop_model, soil_encoder, crop_encoder):
    """
    Save trained sklearn models with proper protocol
    
    Args:
        crop_model: Trained sklearn classifier (RandomForest, SVM, etc.)
        soil_encoder: Trained LabelEncoder for soil types
        crop_encoder: Trained LabelEncoder for crop names
    """
    
    model_dir = os.path.join(os.path.dirname(__file__), "../../Crop_recommend")
    os.makedirs(model_dir, exist_ok=True)
    
    # Save with HIGHEST_PROTOCOL for maximum compatibility
    files = [
        (crop_model, "crop_model.pkl"),
        (soil_encoder, "soil_encoder.pkl"),
        (crop_encoder, "crop_encoder.pkl")
    ]
    
    for obj, filename in files:
        filepath = os.path.join(model_dir, filename)
        try:
            with open(filepath, "wb") as f:
                # Use HIGHEST_PROTOCOL for best compatibility across Python versions
                pickle.dump(obj, f, protocol=pickle.HIGHEST_PROTOCOL)
            print(f"✅ Saved {filename} to {filepath}")
        except Exception as e:
            print(f"❌ Error saving {filename}: {str(e)}")

# ============== EXAMPLE USAGE ==============
# If you have trained your models:
#
# from sklearn.ensemble import RandomForestClassifier
# from sklearn.preprocessing import LabelEncoder
# import pickle
#
# # After training your models:
# crop_model = RandomForestClassifier(...)  # Your trained model
# soil_encoder = LabelEncoder()
# soil_encoder.fit(["loamy soil", "clay", "sandy", ...])
# crop_encoder = LabelEncoder()
# crop_encoder.fit(["Rice", "Wheat", "Sugarcane", ...])
#
# # Save them
# save_trained_models(crop_model, soil_encoder, crop_encoder)
#
# ============================================

if __name__ == "__main__":
    print("📋 Model Saving Template")
    print("=" * 60)
    print("\n✏️  To save your trained models:")
    print("\n1. Import your trained models from your training script")
    print("2. Call save_trained_models(crop_model, soil_encoder, crop_encoder)")
    print("3. Models will be saved to Crop_recommend/ folder")
    print("\n📝 Example:")
    print("   from save_model_template import save_trained_models")
    print("   save_trained_models(your_model, soil_enc, crop_enc)")
    print("\n" + "=" * 60)
