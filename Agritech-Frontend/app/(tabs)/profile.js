import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, TextInput, Modal, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getAuthToken, clearAuthToken, updateFarmerProfile, API_URL } from '../../services/api';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function ProfileScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const [farmerData, setFarmerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  
  // Profile edit state
  const [username, setUsername] = useState("");
  const [mobile, setMobile] = useState("");
  const [location, setLocation] = useState("");
  const [landSize, setLandSize] = useState("");
  const [soilDetails, setSoilDetails] = useState("");
  const [waterAvailability, setWaterAvailability] = useState("");
  const [investment, setInvestment] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    if (params.farmer) {
      try {
        const farmer = typeof params.farmer === 'string' 
          ? JSON.parse(params.farmer) 
          : params.farmer;
        setFarmerData(farmer);
        setUsername(farmer.username || "");
        setMobile(farmer.mobile || "");
        setLocation(farmer.location || "");
        setLandSize(farmer.landSize || "");
        setSoilDetails(farmer.soilDetails || "");
        setWaterAvailability(farmer.waterAvailability || "");
        setInvestment(farmer.investment || "");
        console.log('Farmer data loaded from params:', farmer);
        
        if (farmer.id) {
          fetchFreshFarmerData(farmer.id);
        }
      } catch (e) {
        console.log('Could not parse farmer data:', e);
      }
    }
    setLoading(false);
  }, [params.farmer]);

  const fetchFreshFarmerData = async (farmerId) => {
    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_URL}/farmers/${farmerId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const freshData = await response.json();
        console.log('✅ Fresh farmer data fetched:', freshData);
        setFarmerData(prevData => ({ ...prevData, ...freshData }));
        setUsername(freshData.username || "");
        setMobile(freshData.mobile || "");
        setLocation(freshData.location || "");
        setLandSize(freshData.landSize || "");
        setSoilDetails(freshData.soilDetails || "");
        setWaterAvailability(freshData.waterAvailability || "");
        setInvestment(freshData.investment || "");
      } else {
        console.log('Failed to fetch fresh farmer data:', response.status);
      }
    } catch (error) {
      console.log('Error fetching fresh farmer data:', error);
    }
  };

  const handleUpdateProfile = async () => {
    if (!farmerData) return;
    
    setProfileLoading(true);
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
      
      setFarmerData({...farmerData, ...updatedInfo});
      setShowEditModal(false);
      
    } catch (error) {
      console.log("Update error:", error);
      Alert.alert("Error", "Failed to update profile.");
    } finally {
      setProfileLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', onPress: () => {} },
      {
        text: 'Logout',
        onPress: () => {
          clearAuthToken();
          router.replace('/(auth)/login');
        }
      }
    ]);
  };

  const getWaterAvailabilityDisplay = (value) => {
    const waterMap = {
      'Rainfed Only': '400 mm/year',
      'Limited Borewell': '700 mm/year',
      'Canal / Abundant': '1500 mm/year'
    };
    return waterMap[value] || (value || 'Not specified');
  };

  const getSoilDetailsDisplay = (value) => {
    const soilMap = {
      'Loamy Soil': 'Loamy (Balanced)',
      'Clay Soil': 'Clay (Heavy)',
      'Sandy Soil': 'Sandy (Light)',
      'Laterite Soil': 'Laterite (Red)',
      'Silty Soil': 'Silty (Fine)'
    };
    return soilMap[value] || (value || 'Not specified');
  };

  if (!farmerData) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Please log in to view profile</Text>
        <TouchableOpacity style={styles.loginButton} onPress={() => router.replace('/(auth)/login')}>
          <Text style={styles.buttonText}>GO TO LOGIN</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (showEditModal) {
    return (
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header with back button */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => setShowEditModal(false)} 
            style={styles.backButton}
          >
            <MaterialCommunityIcons name="arrow-left" size={28} color="white" />
          </TouchableOpacity>
          <Text style={styles.profileTitle}>Edit Profile</Text>
          <View style={{ width: 28 }} />
        </View>

        <View style={styles.profileContent}>
          <Text style={styles.label}>Username</Text>
          <TextInput 
            style={styles.input} 
            value={username} 
            onChangeText={setUsername}
            placeholder="Enter username"
          />

          <Text style={styles.label}>Mobile Number</Text>
          <TextInput 
            style={styles.input} 
            value={mobile} 
            onChangeText={setMobile}
            placeholder="Enter mobile number"
          />

          <Text style={styles.label}>Location</Text>
          <TextInput 
            style={styles.input} 
            value={location} 
            onChangeText={setLocation}
            placeholder="Enter location"
          />

          <Text style={styles.label}>Land Size (acres)</Text>
          <TextInput 
            style={styles.input} 
            value={landSize} 
            onChangeText={setLandSize}
            placeholder="Enter land size"
            keyboardType="numeric"
          />

          <Text style={styles.label}>Soil Type</Text>
          <View style={styles.soilOptionsContainer}>
            {['Loamy Soil', 'Clay Soil', 'Sandy Soil', 'Laterite Soil', 'Silty Soil'].map((soil) => (
              <TouchableOpacity
                key={soil}
                style={[
                  styles.soilOption,
                  soilDetails === soil && styles.soilOptionSelected
                ]}
                onPress={() => setSoilDetails(soil)}
              >
                <Text style={styles.soilOptionText}>{soil}</Text>
                {soilDetails === soil && (
                  <MaterialCommunityIcons name="check-circle" size={20} color="#4CAF50" />
                )}
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Water Availability</Text>
          <View style={styles.waterOptionsContainer}>
            {['Rainfed Only', 'Limited Borewell', 'Canal / Abundant'].map((water) => (
              <TouchableOpacity
                key={water}
                style={[
                  styles.waterOption,
                  waterAvailability === water && styles.waterOptionSelected
                ]}
                onPress={() => setWaterAvailability(water)}
              >
                <Text style={styles.waterOptionText}>{water}</Text>
                {waterAvailability === water && (
                  <MaterialCommunityIcons name="check-circle" size={20} color="#4CAF50" />
                )}
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Investment Budget (₹)</Text>
          <TextInput 
            style={styles.input} 
            value={investment} 
            onChangeText={setInvestment}
            placeholder="Enter investment budget"
            keyboardType="numeric"
          />

          <TouchableOpacity 
            style={styles.saveButton}
            onPress={handleUpdateProfile}
            disabled={profileLoading}
          >
            <Text style={styles.saveButtonText}>{profileLoading ? 'Updating...' : 'Save Changes'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <MaterialCommunityIcons name="account-circle" size={40} color="white" />
          <View style={{ marginLeft: 12 }}>
            <Text style={styles.headerTitle}>{farmerData?.username || 'Farmer'}</Text>
            <Text style={styles.headerSubtitle}>{farmerData?.location || 'Location'}</Text>
          </View>
        </View>
      </View>

      {/* Investment Budget Card */}
      <View style={styles.investmentCard}>
        <MaterialCommunityIcons name="cash" size={32} color="#2E7D32" />
        <Text style={styles.investmentAmount}>₹{farmerData?.investment || '0'}</Text>
        <Text style={styles.investmentLabel}>Available Investment Budget</Text>
        <Text style={styles.investmentDesc}>For farm improvements & schemes</Text>
      </View>

      {/* Personal Information */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons name="information" size={20} color="#2E7D32" />
          <Text style={styles.sectionTitle}>Personal Information</Text>
        </View>
        
        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="email" size={20} color="#1976D2" />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{farmerData?.email || 'N/A'}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="phone" size={20} color="#1976D2" />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Mobile</Text>
            <Text style={styles.infoValue}>{farmerData?.mobile || 'Not set'}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="map-marker" size={20} color="#1976D2" />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Location</Text>
            <Text style={styles.infoValue}>{farmerData?.location || 'Not set'}</Text>
          </View>
        </View>
      </View>

      {/* Farm Details */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons name="leaf" size={20} color="#2E7D32" />
          <Text style={styles.sectionTitle}>Farm Details</Text>
        </View>

        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="ruler" size={20} color="#6D4C41" />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Land Size</Text>
            <Text style={styles.infoValue}>{farmerData?.landSize || 'Not set'} acres</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="water" size={20} color="#0097A7" />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Water Availability</Text>
            <Text style={styles.infoValue}>{getWaterAvailabilityDisplay(farmerData?.waterAvailability)}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="flower" size={20} color="#6D4C41" />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Soil Type</Text>
            <Text style={styles.infoValue}>{getSoilDetailsDisplay(farmerData?.soilDetails)}</Text>
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionSection}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => setShowEditModal(true)}
        >
          <MaterialCommunityIcons name="pencil" size={20} color="white" />
          <Text style={styles.actionButtonText}>Edit Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: '#D32F2F' }]}
          onPress={handleLogout}
        >
          <MaterialCommunityIcons name="logout" size={20} color="white" />
          <Text style={styles.actionButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#2E7D32',
    paddingVertical: 25,
    paddingHorizontal: 20,
    paddingTop: 50,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  backButton: {
    padding: 5,
    marginBottom: 10,
  },
  profileTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  investmentCard: {
    backgroundColor: 'white',
    marginHorizontal: 15,
    marginVertical: 15,
    paddingVertical: 20,
    paddingHorizontal: 15,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    borderTopWidth: 4,
    borderTopColor: '#2E7D32',
  },
  investmentAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginTop: 10,
  },
  investmentLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  investmentDesc: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  section: {
    backgroundColor: 'white',
    marginHorizontal: 15,
    marginVertical: 10,
    borderRadius: 12,
    padding: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginLeft: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  infoContent: {
    marginLeft: 15,
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 15,
    color: '#2E7D32',
    fontWeight: '600',
  },
  actionSection: {
    marginHorizontal: 15,
    marginVertical: 15,
    gap: 10,
  },
  actionButton: {
    backgroundColor: '#2E7D32',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  loginButton: {
    backgroundColor: '#2E7D32',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    marginVertical: 20,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  errorText: {
    fontSize: 16,
    color: '#D32F2F',
    textAlign: 'center',
    marginTop: 20,
  },
  profileContent: {
    padding: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 15,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: 'white',
  },
  soilOptionsContainer: {
    gap: 8,
    marginBottom: 10,
  },
  soilOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    backgroundColor: 'white',
  },
  soilOptionSelected: {
    borderColor: '#2E7D32',
    backgroundColor: '#F1F8E9',
  },
  soilOptionText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  waterOptionsContainer: {
    gap: 8,
    marginBottom: 10,
  },
  waterOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    backgroundColor: 'white',
  },
  waterOptionSelected: {
    borderColor: '#0097A7',
    backgroundColor: '#E0F2F1',
  },
  waterOptionText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  saveButton: {
    backgroundColor: '#2E7D32',
    paddingVertical: 14,
    borderRadius: 8,
    marginTop: 20,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
