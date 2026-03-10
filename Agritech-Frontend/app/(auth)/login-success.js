import { View, Text, TextInput, Button, StyleSheet, ScrollView, Alert } from "react-native";
import { useState, useEffect } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { updateFarmerProfile, clearAuthToken } from "../../services/api";

export default function LoginSuccess() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // 1. Parse the farmer data passed from the login screen
  const [farmerData, setFarmerData] = useState(null);

  // 2. Set up state for all editable fields
  const [username, setUsername] = useState("");
  const [mobile, setMobile] = useState("");
  const [location, setLocation] = useState("");
  const [landSize, setLandSize] = useState("");
  const [soilDetails, setSoilDetails] = useState("");
  const [waterAvailability, setWaterAvailability] = useState("");
  const [investment, setInvestment] = useState("");
  const [loading, setLoading] = useState(false);

  // 3. When the screen loads, pre-fill the form with the user's current data
  useEffect(() => {
    if (params.farmer) {
      const parsedFarmer = JSON.parse(params.farmer);
      setFarmerData(parsedFarmer);
      
      setUsername(parsedFarmer.username || "");
      setMobile(parsedFarmer.mobile || "");
      setLocation(parsedFarmer.location || "");
      setLandSize(parsedFarmer.landSize || "");
      setSoilDetails(parsedFarmer.soilDetails || "");
      setWaterAvailability(parsedFarmer.waterAvailability || "");
      setInvestment(parsedFarmer.investment || "");
    }
  }, [params.farmer]);

  // 4. Handle sending the updated data back to the database
  const handleUpdate = async () => {
    if (!farmerData) return;
    
    setLoading(true);
    try {
      const updatedInfo = {
        username,
        mobile,
        location,
        landSize,
        soilDetails,
        waterAvailability,
        investment
      };

      const res = await updateFarmerProfile(farmerData.id, updatedInfo);
      console.log(res);
      Alert.alert("Success", "Your profile has been updated!");
      
      // Redirect to home dashboard with updated farmer data
      router.replace({
        pathname: "/(tabs)/home",
        params: { farmer: JSON.stringify({...farmerData, ...updatedInfo}) }
      }); 
      
    } catch (error) {
      console.log("Update error:", error);
      Alert.alert("Error", "Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    clearAuthToken();
    router.replace("/login");
  };

  if (!farmerData) {
    return (
      <View style={styles.container}>
        <Text>Loading user data...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Welcome, {farmerData.username}!</Text>
      <Text style={styles.subtitle}>You can update your farm details below:</Text>

      <Text style={styles.label}>Username</Text>
      <TextInput style={styles.input} value={username} onChangeText={setUsername} />

      <Text style={styles.label}>Mobile Number</Text>
      <TextInput style={styles.input} value={mobile} onChangeText={setMobile} />

      <Text style={styles.label}>Location</Text>
      <TextInput style={styles.input} value={location} onChangeText={setLocation} />

      <Text style={styles.label}>Land Size (acre)</Text>
      <TextInput style={styles.input} value={landSize} onChangeText={setLandSize} />

      <Text style={styles.label}>Soil Details</Text>
      <TextInput style={styles.input} value={soilDetails} onChangeText={setSoilDetails} />

      <Text style={styles.label}>Water Availability</Text>
      <TextInput style={styles.input} value={waterAvailability} onChangeText={setWaterAvailability} />

      <Text style={styles.label}>Investment Budget</Text>
      <TextInput style={styles.input} value={investment} onChangeText={setInvestment} />

      <View style={styles.buttonContainer}>
        <Button 
          title={loading ? "Saving..." : "Save Changes"} 
          onPress={handleUpdate} 
          disabled={loading} 
        />
      </View>
      
      <View style={styles.buttonContainer}>
        <Button 
          title="Skip to Home" 
          color="green"
          onPress={() => router.replace({
            pathname: "/(tabs)/home",
            params: { farmer: JSON.stringify({...farmerData, username, mobile, location, landSize, soilDetails, waterAvailability, investment}) }
          })} 
        />
      </View>

      <View style={styles.buttonContainer}>
        <Button 
          title="Logout" 
          color="red"
          onPress={handleLogout} 
        />
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#fff",
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 5,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "gray",
    marginBottom: 20,
    textAlign: "center",
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 5,
    color: "#333",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    marginBottom: 15,
    borderRadius: 6,
    backgroundColor: "#f9f9f9",
  },
  buttonContainer: {
    marginTop: 10,
    marginBottom: 20,
  }
});