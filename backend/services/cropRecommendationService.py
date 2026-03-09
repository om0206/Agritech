import joblib
import sys
import json
import os
import numpy as np

# Get the directory where the models are stored
MODEL_DIR = os.path.join(os.path.dirname(__file__), "../../Crop_recommend")

def load_models():
    """Load trained models and encoders using joblib (compatible with sklearn)"""
    model_path = os.path.join(MODEL_DIR, "crop_model.pkl")
    soil_encoder_path = os.path.join(MODEL_DIR, "soil_encoder.pkl")
    crop_encoder_path = os.path.join(MODEL_DIR, "crop_encoder.pkl")
    
    # Check if files exist
    if not os.path.exists(model_path):
        print(json.dumps({"error": f"❌ Model file not found. Save your trained model to: {model_path}"}))
        sys.exit(1)
    if not os.path.exists(soil_encoder_path):
        print(json.dumps({"error": f"❌ Soil encoder not found. Save to: {soil_encoder_path}"}))
        sys.exit(1)
    if not os.path.exists(crop_encoder_path):
        print(json.dumps({"error": f"❌ Crop encoder not found. Save to: {crop_encoder_path}"}))
        sys.exit(1)
    
    try:
        # Load using joblib (native sklearn format)
        crop_model = joblib.load(model_path)
        soil_encoder = joblib.load(soil_encoder_path)
        crop_encoder = joblib.load(crop_encoder_path)
        
        print("🤖 All models loaded successfully!", file=sys.stderr)
        return crop_model, soil_encoder, crop_encoder
    
    except Exception as e:
        print(json.dumps({"error": f"❌ Model loading failed: {str(e)}"}))
        sys.exit(1)

def predict_crops(temperature, humidity, soil_type, water_availability):
    """
    Predict top 3 crops based on weather and farm conditions
    
    Args:
        temperature (float): Temperature in Celsius
        humidity (float): Humidity as percentage (0-100)
        soil_type (str): Type of soil
        water_availability (float): Water availability in mm
    
    Returns:
        list: Top 3 recommended crops with probabilities
    """
    try:
        crop_model, soil_encoder, crop_encoder = load_models()
        
        # Normalize soil type input
        # Map common variations to training data values
        soil_mapping = {
            'sandy soil': 'Sandy',
            'sandy': 'Sandy',
            'clay soil': 'Clay',
            'clay': 'Clay',
            'loamy soil': 'Loamy',
            'loamy': 'Loamy',
            'silty soil': 'Silty',
            'silty': 'Silty',
            'laterite soil': 'Laterite',
            'laterite': 'Laterite'
        }
        
        normalized_soil = soil_mapping.get(soil_type.lower().strip(), soil_type)
        
        # Encode soil type
        try:
            soil_encoded = soil_encoder.transform([normalized_soil])[0]
        except Exception as e:
            print(f"❌ Error encoding soil type '{soil_type}': {str(e)}", file=sys.stderr)
            print(json.dumps({"error": f"Invalid soil type: {soil_type}. Valid types: Clay, Silty, Loamy, Sandy, Laterite"}))
            sys.exit(1)
        
        # Prepare features in the order expected by the model
        # Assuming model expects: [temperature, humidity, soil_type_encoded, water_availability]
        features = [[temperature, humidity, soil_encoded, water_availability]]
        
        # Get predictions and probabilities
        try:
            # If model has predict_proba method
            if hasattr(crop_model, 'predict_proba'):
                probabilities = crop_model.predict_proba(features)[0]
                predicted_crop_indices = crop_model.classes_
                
                # Get top 3 crops (ensure exactly 3)
                num_crops = min(3, len(probabilities))
                top_3_indices = probabilities.argsort()[-num_crops:][::-1]
                recommendations = []
                
                for idx in top_3_indices:
                    crop_index = predicted_crop_indices[idx]
                    # Decode the crop index back to crop name
                    crop_name = crop_encoder.inverse_transform([crop_index])[0]
                    probability = float(probabilities[idx])
                    recommendations.append({
                        "crop": str(crop_name),  # Ensure string type
                        "probability": round(probability * 100, 2),
                        "confidence": "High" if probability > 0.5 else "Medium" if probability > 0.25 else "Low"
                    })
                
                # Ensure exactly 3 crops returned (should never exceed 3)
                recommendations = recommendations[:3]
                return recommendations
            else:
                # Fallback to simple prediction
                prediction = crop_model.predict(features)[0]
                return [{"crop": prediction, "probability": 100, "confidence": "High"}]
        
        except Exception as e:
            print(json.dumps({"error": f"❌ Prediction failed: {str(e)}"}))
            sys.exit(1)
    
    except Exception as e:
        print(json.dumps({"error": f"❌ Service error: {str(e)}"}))
        sys.exit(1)

if __name__ == "__main__":
    # Read input from command line arguments
    if len(sys.argv) < 5:
        print(json.dumps({"error": "Insufficient arguments. Expected: temperature humidity soil_type water_availability"}))
        sys.exit(1)
    
    try:
        temperature = float(sys.argv[1])
        humidity = float(sys.argv[2])
        soil_type = sys.argv[3]
        water_availability = float(sys.argv[4])
        
        recommendations = predict_crops(temperature, humidity, soil_type, water_availability)
        print(json.dumps({"success": True, "recommendations": recommendations}))
    
    except ValueError as e:
        print(json.dumps({"error": f"Invalid input format: {str(e)}"}))
        sys.exit(1)
    except Exception as e:
        print(json.dumps({"error": f"Unexpected error: {str(e)}"}))
        sys.exit(1)
