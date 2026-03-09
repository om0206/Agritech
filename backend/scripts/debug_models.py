"""
Debug script to check model loading status
"""
import pickle
import os
import sys

MODEL_DIR = os.path.join(os.path.dirname(__file__), "../../Crop_recommend")

print("=" * 70)
print("MODEL LOADING DEBUG")
print("=" * 70)

files = ["crop_model.pkl", "soil_encoder.pkl", "crop_encoder.pkl"]

for filename in files:
    filepath = os.path.join(MODEL_DIR, filename)
    print(f"\n📂 Checking: {filename}")
    print(f"   Path: {filepath}")
    print(f"   Exists: {os.path.exists(filepath)}")
    
    if os.path.exists(filepath):
        try:
            size = os.path.getsize(filepath)
            print(f"   Size: {size} bytes")
            
            # Try loading with different encodings
            encodings = [None, 'latin1', 'bytes', 'ascii']
            loaded = False
            
            for encoding in encodings:
                try:
                    with open(filepath, "rb") as f:
                        if encoding:
                            obj = pickle.load(f, encoding=encoding)
                        else:
                            obj = pickle.load(f)
                    print(f"   ✅ Loaded successfully with encoding={encoding}")
                    print(f"      Type: {type(obj).__name__}")
                    
                    # Check if it's a model with required attributes
                    if hasattr(obj, 'predict_proba'):
                        print(f"      Has predict_proba: YES")
                    if hasattr(obj, 'classes_'):
                        print(f"      Has classes_: YES (count: {len(obj.classes_)})")
                    if hasattr(obj, 'transform'):
                        print(f"      Has transform: YES")
                    
                    loaded = True
                    break
                except Exception as e:
                    pass
            
            if not loaded:
                print(f"   ❌ Could NOT load with any encoding")
                print(f"   This file is CORRUPTED and needs to be replaced")
        
        except Exception as e:
            print(f"   ❌ Error: {str(e)}")
    else:
        print(f"   ❌ FILE NOT FOUND - Must save trained model here!")

print("\n" + "=" * 70)
print("SOLUTION:")
print("=" * 70)
print("""
If files not found or corrupted:
1. Open your model training script (Jupyter notebook or Python file)
2. After training, add model saving code:

   import pickle
   import os
   
   model_dir = "Crop_recommend"
   os.makedirs(model_dir, exist_ok=True)
   
   with open(os.path.join(model_dir, "crop_model.pkl"), "wb") as f:
       pickle.dump(crop_model, f, protocol=pickle.HIGHEST_PROTOCOL)
   
   with open(os.path.join(model_dir, "soil_encoder.pkl"), "wb") as f:
       pickle.dump(soil_encoder, f, protocol=pickle.HIGHEST_PROTOCOL)
   
   with open(os.path.join(model_dir, "crop_encoder.pkl"), "wb") as f:
       pickle.dump(crop_encoder, f, protocol=pickle.HIGHEST_PROTOCOL)

3. Run the training script to generate fresh .pkl files
4. Restart backend server
""")
