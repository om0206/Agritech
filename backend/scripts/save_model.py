"""
Model saving utility - Re-saves pickle files with proper protocol for compatibility
Run this script to properly save your trained sklearn models
"""

import pickle
import os
import sys

def resave_models(model_dir=None):
    """Re-save models with HIGHEST_PROTOCOL for better compatibility"""
    
    if model_dir is None:
        model_dir = os.path.join(os.path.dirname(__file__), "../../Crop_recommend")
    
    files_to_resave = [
        ("crop_model.pkl", "Crop Model"),
        ("soil_encoder.pkl", "Soil Encoder"),
        ("crop_encoder.pkl", "Crop Encoder")
    ]
    
    for filename, label in files_to_resave:
        filepath = os.path.join(model_dir, filename)
        
        if not os.path.exists(filepath):
            print(f"❌ {label} not found at {filepath}")
            continue
        
        try:
            print(f"\n📂 Processing {label}...")
            
            # Try loading with different encodings
            model = None
            encodings = [None, 'latin1', 'bytes', 'ascii']
            
            for encoding in encodings:
                try:
                    with open(filepath, "rb") as f:
                        if encoding:
                            model = pickle.load(f, encoding=encoding)
                        else:
                            model = pickle.load(f)
                    print(f"   ✅ Loaded with encoding={encoding}")
                    break
                except Exception as e:
                    continue
            
            if model is None:
                print(f"   ❌ Failed to load {label} with any encoding")
                continue
            
            # Re-save with HIGHEST_PROTOCOL
            with open(filepath, "wb") as f:
                pickle.dump(model, f, protocol=pickle.HIGHEST_PROTOCOL)
            
            print(f"   ✅ Re-saved {label} with protocol={pickle.HIGHEST_PROTOCOL}")
            print(f"   📦 File: {filepath}")
            
        except Exception as e:
            print(f"   ❌ Error processing {label}: {str(e)}")

if __name__ == "__main__":
    print("🔄 Starting model re-save process...")
    print("=" * 60)
    
    resave_models()
    
    print("\n" + "=" * 60)
    print("✅ Model re-saving complete!")
    print("\n🚀 Next steps:")
    print("   1. Test the backend crop recommendation endpoint")
    print("   2. Check if models load successfully")
    print("   3. Verify crop predictions work as expected")
