import { View, Text, TextInput, Button, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { useState, useEffect } from "react";
import { useRouter } from "expo-router";
import { signupUser, API_URL } from "../../services/api";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export default function Signup() {
  const router = useRouter();

  const [username,setUsername] = useState("");
  const [email,setEmail] = useState("");
  const [password,setPassword] = useState("");
  const [mobile,setMobile] = useState("");
  const [location,setLocation] = useState("");
  const [landSize,setLandSize] = useState("");
  const [soilDetails,setSoilDetails] = useState("");
  const [waterAvailability,setWaterAvailability] = useState("");
  const [investment,setInvestment] = useState("");
  const [waterOptions, setWaterOptions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch water availability options from backend
  useEffect(() => {
    const fetchWaterOptions = async () => {
      try {
        const response = await fetch(`${API_URL}/farmers/options/water-availability`);
        const data = await response.json();
        
        // Handle different response formats
        let options = [];
        if (Array.isArray(data)) {
          options = data;
        } else if (data.options && Array.isArray(data.options)) {
          options = data.options;
        } else if (data && typeof data === 'object') {
          // If response is an object, convert to array
          options = Object.values(data);
        }
        
        setWaterOptions(Array.isArray(options) ? options : []);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching water options:", error);
        // Fallback options if API fails
        setWaterOptions([
          { label: "Rainfed Only", value: "rainfed_only" },
          { label: "Limited Borewell", value: "limited_borewell" },
          { label: "Adequate Borewell", value: "adequate_borewell" },
          { label: "Canal Irrigation", value: "canal_irrigation" },
          { label: "Well Water", value: "well_water" },
          { label: "Tap Water", value: "tap_water" },
          { label: "Drip Irrigation", value: "drip_irrigation" },
          { label: "Rainwater Harvesting", value: "rainwater_harvesting" }
        ]);
        setLoading(false);
      }
    };
    fetchWaterOptions();
  }, []);

  const handleSignup = async () => {

    console.log("Register pressed");

    try {

      const res = await signupUser({
        username,
        email,
        password,
        mobile,
        location,
        landSize,
        soilDetails,
        waterAvailability,  // Send the value, not label
        investment
      });

      console.log(res);
      alert("Registration successful! Please login with your credentials");
      router.push("/(auth)/login");

    } catch (error) {

      console.log(error);
      alert("Signup failed: " + (error.message || "Unknown error"));

    }

  };

  return (

    <ScrollView style={styles.container}>

      <Text style={styles.title}>Farmer Registration</Text>

      <TextInput style={styles.input} placeholder="Username" onChangeText={setUsername}/>
      <TextInput style={styles.input} placeholder="Email" onChangeText={setEmail}/>
      <TextInput style={styles.input} placeholder="Password" secureTextEntry onChangeText={setPassword}/>
      <TextInput style={styles.input} placeholder="Mobile Number" onChangeText={setMobile}/>
      <TextInput style={styles.input} placeholder="Location" onChangeText={setLocation}/>
      <TextInput style={styles.input} placeholder="Land Size (acre)" onChangeText={setLandSize}/>
      
      <Text style={styles.label}>Soil Details</Text>
      <Text style={styles.labelDescription}>Select your soil type</Text>
      
      {/* Soil Details Reference Guide */}
      <View style={styles.referenceBox}>
        <MaterialCommunityIcons name="information" size={18} color="#6D4C41" />
        <View style={{ marginLeft: 10, flex: 1 }}>
          <Text style={styles.referenceTitle}>Soil Types Guide</Text>
          <Text style={styles.referenceItem}>🌍 Loamy: Balanced, best for crops</Text>
          <Text style={styles.referenceItem}>🟤 Clay: Heavy, retains water</Text>
          <Text style={styles.referenceItem}>🟡 Sandy: Light, quick drainage</Text>
          <Text style={styles.referenceItem}>🔴 Laterite: Red soil, tropical</Text>
          <Text style={styles.referenceItem}>⚪ Silty: Fine, moderately fertile</Text>
        </View>
      </View>

      {/* Soil Details Option 1 - Loamy */}
      <TouchableOpacity 
        style={[
          styles.soilOption,
          soilDetails === "Loamy Soil" && styles.soilOptionSelected
        ]}
        onPress={() => setSoilDetails("Loamy Soil")}
      >
        <View style={styles.soilOptionContent}>
          <Text style={styles.soilOptionTitle}>🌍 Loamy Soil</Text>
          <Text style={styles.soilOptionDesc}>Balanced, best for most crops</Text>
          <Text style={styles.soilOptionMM}>Ideal drainage & fertility</Text>
        </View>
        {soilDetails === "Loamy Soil" && (
          <MaterialCommunityIcons name="check-circle" size={24} color="#4CAF50" />
        )}
      </TouchableOpacity>

      {/* Soil Details Option 2 - Clay */}
      <TouchableOpacity 
        style={[
          styles.soilOption,
          soilDetails === "Clay Soil" && styles.soilOptionSelected
        ]}
        onPress={() => setSoilDetails("Clay Soil")}
      >
        <View style={styles.soilOptionContent}>
          <Text style={styles.soilOptionTitle}>🟤 Clay Soil</Text>
          <Text style={styles.soilOptionDesc}>Heavy, high water retention</Text>
          <Text style={styles.soilOptionMM}>Suitable for water-loving crops</Text>
        </View>
        {soilDetails === "Clay Soil" && (
          <MaterialCommunityIcons name="check-circle" size={24} color="#4CAF50" />
        )}
      </TouchableOpacity>

      {/* Soil Details Option 3 - Sandy */}
      <TouchableOpacity 
        style={[
          styles.soilOption,
          soilDetails === "Sandy Soil" && styles.soilOptionSelected
        ]}
        onPress={() => setSoilDetails("Sandy Soil")}
      >
        <View style={styles.soilOptionContent}>
          <Text style={styles.soilOptionTitle}>🟡 Sandy Soil</Text>
          <Text style={styles.soilOptionDesc}>Light, quick drainage</Text>
          <Text style={styles.soilOptionMM}>Requires more irrigation</Text>
        </View>
        {soilDetails === "Sandy Soil" && (
          <MaterialCommunityIcons name="check-circle" size={24} color="#4CAF50" />
        )}
      </TouchableOpacity>

      {/* Soil Details Option 4 - Laterite */}
      <TouchableOpacity 
        style={[
          styles.soilOption,
          soilDetails === "Laterite Soil" && styles.soilOptionSelected
        ]}
        onPress={() => setSoilDetails("Laterite Soil")}
      >
        <View style={styles.soilOptionContent}>
          <Text style={styles.soilOptionTitle}>🔴 Laterite Soil</Text>
          <Text style={styles.soilOptionDesc}>Red soil, iron-rich</Text>
          <Text style={styles.soilOptionMM}>Common in tropical regions</Text>
        </View>
        {soilDetails === "Laterite Soil" && (
          <MaterialCommunityIcons name="check-circle" size={24} color="#4CAF50" />
        )}
      </TouchableOpacity>

      {/* Soil Details Option 5 - Silty */}
      <TouchableOpacity 
        style={[
          styles.soilOption,
          soilDetails === "Silty Soil" && styles.soilOptionSelected
        ]}
        onPress={() => setSoilDetails("Silty Soil")}
      >
        <View style={styles.soilOptionContent}>
          <Text style={styles.soilOptionTitle}>⚪ Silty Soil</Text>
          <Text style={styles.soilOptionDesc}>Fine particles, moderately fertile</Text>
          <Text style={styles.soilOptionMM}>Good water retention</Text>
        </View>
        {soilDetails === "Silty Soil" && (
          <MaterialCommunityIcons name="check-circle" size={24} color="#4CAF50" />
        )}
      </TouchableOpacity>
      
      <Text style={styles.label}>Water Availability</Text>
      <Text style={styles.labelDescription}>Select your water source availability</Text>
      
      {loading ? (
        <ActivityIndicator size="large" color="#0097A7" style={{ marginVertical: 20 }} />
      ) : (
        <>
          {/* Water Availability Reference Guide */}
          <View style={styles.referenceBox}>
            <MaterialCommunityIcons name="information" size={18} color="#0097A7" />
            <View style={{ marginLeft: 10, flex: 1 }}>
              <Text style={styles.referenceTitle}>Water Availability Guide</Text>
              <Text style={styles.referenceItem}>🌧️ Rainfed: Rain only (400 mm)</Text>
              <Text style={styles.referenceItem}>💧 Limited: Borewell 3-5h (700 mm)</Text>
              <Text style={styles.referenceItem}>💦 Adequate: Borewell 8+ hours (1200 mm)</Text>
              <Text style={styles.referenceItem}>🚰 Canal/High: River/Canal (1500+ mm)</Text>
            </View>
          </View>
          
          {/* Dynamic Water Availability Options */}
          {Array.isArray(waterOptions) && waterOptions.length > 0 ? (
            waterOptions.map((option) => (
              <TouchableOpacity 
                key={option.value}
                style={[
                  styles.waterOption,
                  waterAvailability === option.value && styles.waterOptionSelected
                ]}
                onPress={() => setWaterAvailability(option.value)}
              >
                <View style={styles.waterOptionContent}>
                  <Text style={styles.waterOptionTitle}>{option.label}</Text>
                  <Text style={styles.waterOptionDesc}>Select this water source</Text>
                </View>
                {waterAvailability === option.value && (
                  <MaterialCommunityIcons name="check-circle" size={24} color="#4CAF50" />
                )}
              </TouchableOpacity>
            ))
          ) : (
            <Text style={{ color: 'red', marginVertical: 10 }}>No options available</Text>
          )}
        </>
      )}
      
      <TextInput style={styles.input} placeholder="Investment Budget" onChangeText={setInvestment}/>

      <Button title="REGISTER" onPress={handleSignup} />

    </ScrollView>

  );

}

const styles = StyleSheet.create({

  container:{
    padding:20,
    backgroundColor:"#fff"
  },

  title:{
    fontSize:26,
    fontWeight:"bold",
    marginBottom:20,
    textAlign:"center"
  },

  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 10,
  },

  labelDescription: {
    fontSize: 12,
    color: '#999',
    marginBottom: 12,
    marginTop: -8,
  },

  input:{
    borderWidth:1,
    borderColor:"#ccc",
    padding:12,
    marginBottom:15,
    borderRadius:6
  },

  referenceBox: {
    backgroundColor: '#E0F2F1',
    borderRadius: 10,
    padding: 12,
    marginBottom: 15,
    flexDirection: 'row',
    borderLeftWidth: 4,
    borderLeftColor: '#0097A7',
  },

  referenceTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#00695C',
    marginBottom: 6,
  },

  referenceItem: {
    fontSize: 12,
    color: '#00796B',
    marginBottom: 3,
    fontWeight: '500',
  },

  waterOption: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 15,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  waterOptionSelected: {
    borderColor: '#4CAF50',
    backgroundColor: '#F1F8E9',
  },

  waterOptionContent: {
    flex: 1,
  },

  waterOptionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },

  waterOptionDesc: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },

  waterOptionMM: {
    fontSize: 11,
    color: '#0097A7',
    fontWeight: '600',
  },

  soilOption: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 15,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  soilOptionSelected: {
    borderColor: '#4CAF50',
    backgroundColor: '#F1F8E9',
  },

  soilOptionContent: {
    flex: 1,
  },

  soilOptionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },

  soilOptionDesc: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },

  soilOptionMM: {
    fontSize: 11,
    color: '#6D4C41',
    fontWeight: '600',
  },

});