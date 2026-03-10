import React, { useState, useEffect } from 'react';
import { 
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, 
  ActivityIndicator, Modal, TextInput, Platform 
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { clearAuthToken, API_URL, getAuthToken } from '../../services/api';
import DateTimePicker from '@react-native-community/datetimepicker';

// JWT decode helper
const decodeToken = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map((c) => {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (err) {
    console.error('Error decoding token:', err);
    return null;
  }
};

export default function CropRecommendationScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const [farmerData, setFarmerData] = useState(null);
  const [cropOptions, setCropOptions] = useState([]);
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isLocked, setIsLocked] = useState(false);
  const [selectedCrop, setSelectedCrop] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationStep, setConfirmationStep] = useState('crop'); // 'crop' or 'date'
  const [customCropName, setCustomCropName] = useState('');
  const [isOtherSelected, setIsOtherSelected] = useState(false);
  const [sowingDate, setSowingDate] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [sowingDateFromJourney, setSowingDateFromJourney] = useState(null);
  const [manualDateInput, setManualDateInput] = useState('');
  const [showCropRecommendation, setShowCropRecommendation] = useState(false);

  useEffect(() => {
    if (params.farmer) {
      try {
        const farmer = typeof params.farmer === 'string' 
          ? JSON.parse(params.farmer) 
          : params.farmer;
        setFarmerData(farmer);
        // Fetch crop recommendations after farmer data is set
        fetchCropRecommendations(farmer.id);
      } catch (e) {
        console.log('Could not parse farmer data:', e);
        setError('Failed to load farmer data');
      }
    } else {
      // If no params, try to fetch farmer data from backend
      fetchFarmerDataFromToken();
    }
  }, [params.farmer]);

  const fetchFarmerDataFromToken = async () => {
    try {
      const token = await getAuthToken();
      if (!token) {
        setError('Please log in to view recommendations');
        return;
      }

      setLoading(true);
      
      // Decode JWT to get farmer ID
      const decoded = decodeToken(token);
      const farmerId = decoded?.id;

      if (!farmerId) {
        throw new Error('Invalid token');
      }

      // Fetch farmer profile using the extracted ID
      const response = await fetch(`${API_URL}/farmers/${farmerId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch farmer data');
      }

      const data = await response.json();
      setFarmerData(data);
      if (data.id) {
        fetchCropRecommendations(data.id);
      }
    } catch (err) {
      console.error('Error fetching farmer data:', err);
      setError('Please log in to view recommendations');
    } finally {
      setLoading(false);
    }
  };

  // Fetch sowing date from crop journey when crop is locked
  useEffect(() => {
    if (isLocked && farmerData?.id) {
      fetchSowingDate(farmerData.id);
    }
  }, [isLocked, farmerData?.id]);

  const fetchSowingDate = async (farmerId) => {
    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_URL}/farmers/${farmerId}/journey/current`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.currentJourney?.crop_sowing_date) {
          setSowingDateFromJourney(new Date(data.currentJourney.crop_sowing_date));
        }
      }
    } catch (err) {
      console.error('Error fetching sowing date:', err);
    }
  };

  const fetchCropRecommendations = async (farmerId) => {
    setLoading(true);
    setError(null);
    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_URL}/farmers/${farmerId}/crop-recommendations`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch crop recommendations');
      }

      const data = await response.json();
      console.log('Crop recommendations:', data);

      // Check if crop is already locked
      if (data.isLocked) {
        setIsLocked(true);
        setSelectedCrop({
          name: data.selectedCrop,
          isLocked: true,
          selectedDate: data.selectedDate,
          marketPrice: data.marketPrice
        });
        return;
      }

      // Build 4 options: 3 recommended + 1 "Other"
      const topThreeCrops = data.recommendations.slice(0, 3).map((crop, index) => ({
        id: index + 1,
        name: crop.crop,
        icon: 'sprout',
        suitability: `${crop.probability}%`,
        waterRequired: data.farmConditions?.waterAvailability || 'N/A',
        soilType: data.farmConditions?.soilType || 'N/A',
        season: 'Year-round',
        yield: crop.confidence,
        color: index === 0 ? '#C8E6C9' : index === 1 ? '#FFE0B2' : '#FFF9C4',
        marketPrice: crop.marketPrice,  // Include market price from API
        priority: crop.priority
      }));

      // Add "Other" option
      const otherOption = {
        id: 4,
        name: 'Other',
        icon: 'plus-circle',
        suitability: 'Custom',
        waterRequired: 'Custom',
        soilType: 'Custom',
        season: 'Custom',
        yield: 'Custom',
        color: '#EEEEEE',
        isOther: true,
        marketPrice: null
      };

      setCropOptions([...topThreeCrops, otherOption]);
      setWeather(data.weather);
    } catch (err) {
      console.error('Error fetching recommendations:', err);
      setError(err.message || 'Failed to fetch recommendations');
      setCropOptions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCropSelection = (crop) => {
    if (crop.isOther) {
      setIsOtherSelected(true);
      setSelectedCrop(crop);
    } else {
      setSelectedCrop(crop);
      setIsOtherSelected(false);
    }
    setShowConfirmation(true);
    setConfirmationStep('crop');
  };

  const handleContinueToDate = () => {
    // Validate crop selection before moving to date step
    const cropToSave = isOtherSelected ? customCropName : selectedCrop.name;

    if (cropToSave.trim() === '') {
      Alert.alert('Error', 'Please enter a crop name');
      return;
    }

    // Move to date step
    setConfirmationStep('date');
  };

  const handleBackToCrop = () => {
    // Go back to crop selection step
    setSowingDate(null);
    setManualDateInput('');
    setConfirmationStep('crop');
  };

  const handleConfirmSelection = async () => {
    if (!selectedCrop) return;

    const cropToSave = isOtherSelected ? customCropName : selectedCrop.name;

    if (cropToSave.trim() === '') {
      Alert.alert('Error', 'Please enter a crop name');
      return;
    }

    if (!sowingDate) {
      Alert.alert('Error', 'Please select a sowing date');
      return;
    }

    try {
      setLoading(true);
      const token = await getAuthToken();
      const response = await fetch(`${API_URL}/farmers/${farmerData.id}/select-crop`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          selectedCrop: cropToSave
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save crop selection');
      }

      const data = await response.json();
      console.log('Crop selection saved:', data);

      // Now save the sowing date
      const dateString = sowingDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD
      const dateResponse = await fetch(`${API_URL}/farmers/${farmerData.id}/journey/sowing-date`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sowingDate: dateString
        })
      });

      if (!dateResponse.ok) {
        const dateErrorData = await dateResponse.json();
        throw new Error(dateErrorData.error || 'Failed to save sowing date');
      }

      console.log('Sowing date saved successfully');

      setShowConfirmation(false);
      setConfirmationStep('crop');
      setIsLocked(true);
      setSelectedCrop({
        name: cropToSave,
        isLocked: true,
        selectedDate: sowingDate,
        marketPrice: !isOtherSelected ? selectedCrop.marketPrice : null
      });

      Alert.alert(
        '✅ Crop & Sowing Date Locked!',
        `Your crop "${cropToSave}" with sowing date ${sowingDate.toLocaleDateString('en-IN')} is now locked.\n\nYou can view your crop details on your Profile page.`,
        [
          { 
            text: 'Go to Home', 
            onPress: () => {
              router.push({
                pathname: '/(tabs)/home',
                params: { 
                  farmer: JSON.stringify(farmerData)
                }
              });
            }
          },
          { text: 'Stay Here', onPress: () => {} }
        ]
      );
    } catch (err) {
      console.error('Error saving crop or sowing date:', err);
      Alert.alert('Error', err.message || 'Failed to save crop or sowing date');
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (dateString) => {
    setManualDateInput(dateString);
    
    // Try to parse the date (accepts DD-MM-YYYY, YYYY-MM-DD, DD/MM/YYYY formats)
    if (dateString.trim() === '') {
      setSowingDate(null);
      return;
    }
    
    // Try different date formats
    let parsedDate = null;
    
    // Try YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      parsedDate = new Date(dateString + 'T00:00:00');
    }
    // Try DD-MM-YYYY
    else if (/^\d{2}-\d{2}-\d{4}$/.test(dateString)) {
      const [day, month, year] = dateString.split('-');
      parsedDate = new Date(year, month - 1, day);
    }
    // Try DD/MM/YYYY
    else if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
      const [day, month, year] = dateString.split('/');
      parsedDate = new Date(year, month - 1, day);
    }
    
    if (parsedDate && !isNaN(parsedDate.getTime())) {
      setSowingDate(parsedDate);
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

  if (!farmerData) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Please log in to view recommendations</Text>
        <TouchableOpacity style={styles.loginButton} onPress={() => router.replace('/(auth)/login')}>
          <Text style={styles.buttonText}>GO TO LOGIN</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading && cropOptions.length === 0) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#2E7D32" />
        <Text style={styles.loadingText}>Loading recommendations...</Text>
      </View>
    );
  }

  if (error && cropOptions.length === 0) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
        <MaterialCommunityIcons name="alert-circle" size={60} color="#D32F2F" />
        <Text style={[styles.errorText, { marginTop: 20 }]}>Error: {error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => fetchCropRecommendations(farmerData.id)}>
          <Text style={styles.buttonText}>RETRY</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {!showCropRecommendation ? (
        <>
          {/* Welcome Header */}
          <View style={styles.welcomeHeader}>
            <View style={styles.welcomeContent}>
              <MaterialCommunityIcons name="account-circle" size={48} color="white" />
              <View style={styles.welcomeText}>
                <Text style={styles.welcomeLabel}>Welcome,</Text>
                <Text style={styles.welcomeName}>{farmerData?.username || 'Farmer'}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={handleLogout}>
              <MaterialCommunityIcons name="menu" size={28} color="white" />
            </TouchableOpacity>
          </View>

          {/* Crop Recommendations Section */}
          <View style={styles.cropRecSection}>
            <Text style={styles.cropRecLabel}>🌱 Crop Recommendations</Text>
          </View>

          {/* Main Card */}
          <View style={styles.mainCard}>
            <MaterialCommunityIcons name="leaf" size={64} color="#2E7D32" style={{ marginBottom: 16 }} />
            <Text style={styles.mainCardTitle}>Personalized Crop Suggestions</Text>
            <Text style={styles.mainCardDesc}>Get AI-powered crop recommendations based on your soil, water availability, and location.</Text>
            <TouchableOpacity 
              style={styles.viewCropsButton}
              onPress={() => {
                fetchCropRecommendations(farmerData.id);
                setShowCropRecommendation(true);
              }}
            >
              <MaterialCommunityIcons name="leaf" size={20} color="white" style={{ marginRight: 8 }} />
              <Text style={styles.viewCropsButtonText}>VIEW CROPS</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : null}

      {/* Crop Recommendation Section - Section 2 (Expanded View) */}
      {showCropRecommendation && (
        <>
          {/* Back Button */}
          <View style={styles.backButtonSection}>
            <TouchableOpacity 
              onPress={() => setShowCropRecommendation(false)}
              style={styles.backButtonContainer}
            >
              <MaterialCommunityIcons name="chevron-left" size={28} color="#2E7D32" />
              <Text style={styles.backButtonText}>Back to Home</Text>
            </TouchableOpacity>
          </View>

          {/* Locked Status Card */}
          {isLocked && (
            <View style={styles.lockedCard}>
              <MaterialCommunityIcons name="lock" size={32} color="#D32F2F" />
              <Text style={styles.lockedTitle}>Crop Selection Locked</Text>
              <Text style={styles.lockedCrop}>Selected Crop: {selectedCrop.name}</Text>
              <Text style={styles.lockedDate}>
                Selected on: {new Date(selectedCrop.selectedDate).toLocaleDateString()}
              </Text>
              {sowingDateFromJourney && (
                <Text style={styles.lockedDate}>
                  Selected Sowing Date: {sowingDateFromJourney.toLocaleDateString('en-IN')}
                </Text>
              )}
              <Text style={styles.lockedMessage}>
                Your crop selection is locked and cannot be changed. You have access to this section for reference only.
              </Text>
            </View>
          )}

          {/* Info Card */}
          {!isLocked && (
        <View style={styles.infoSection}>
          <View style={styles.infoBox}>
            <MaterialCommunityIcons name="information" size={24} color="#1976D2" />
            <View style={styles.infoText}>
              <Text style={styles.infoTitle}>Select Your Crop</Text>
              <Text style={styles.infoDesc}>Choose from recommendations or add your own crop. Once selected, it cannot be changed.</Text>
            </View>
          </View>
        </View>
      )}

      {/* Crop Options / Selected Crop */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {isLocked ? 'Your Selected Crop' : 'Available Options'}
        </Text>
        
        {isLocked ? (
          <View style={[styles.cropCard, { backgroundColor: '#E8F5E9', borderWidth: 2, borderColor: '#4CAF50' }]}>
            <View style={styles.cropHeader}>
              <View style={styles.cropIcon}>
                <MaterialCommunityIcons name="check-circle" size={40} color="#4CAF50" />
              </View>
              <View style={styles.cropInfo}>
                <Text style={styles.cropName}>{selectedCrop.name}</Text>
                <View style={styles.suitabilityBadge}>
                  <MaterialCommunityIcons name="lock" size={14} color="#D32F2F" />
                  <Text style={styles.suitabilityText}>Selection Locked</Text>
                </View>
              </View>
            </View>
            {selectedCrop.marketPrice && (
              <View style={styles.cropDetails}>
                <View style={styles.detailItem}>
                  <MaterialCommunityIcons name="currency-inr" size={16} color="#00796B" />
                  <Text style={styles.detailLabel}>Current Market Price</Text>
                  <Text style={[styles.detailValue, { fontSize: 16, fontWeight: 'bold', color: '#00796B' }]}>
                    ₹{selectedCrop.marketPrice.price}/quintal
                  </Text>
                </View>
                <View style={styles.detailItem}>
                  <MaterialCommunityIcons name="information" size={16} color="#1976D2" />
                  <Text style={styles.detailLabel}>Price Range</Text>
                  <Text style={styles.detailValue}>₹{selectedCrop.marketPrice.minPrice} - ₹{selectedCrop.marketPrice.maxPrice}</Text>
                </View>
              </View>
            )}
          </View>
        ) : (
          cropOptions.map((crop) => (
            <TouchableOpacity 
              key={crop.id} 
              style={[
                styles.cropCard, 
                { 
                  backgroundColor: crop.color,
                  borderWidth: selectedCrop?.id === crop.id ? 3 : 0,
                  borderColor: selectedCrop?.id === crop.id ? '#2E7D32' : 'transparent'
                }
              ]}
              onPress={() => handleCropSelection(crop)}
            >
              <View style={styles.cropHeader}>
                <View style={styles.cropIcon}>
                  <MaterialCommunityIcons 
                    name={crop.icon} 
                    size={40} 
                    color={crop.isOther ? '#757575' : '#2E7D32'} 
                  />
                </View>
                <View style={styles.cropInfo}>
                  <Text style={styles.cropName}>{crop.name}</Text>
                  {!crop.isOther && (
                    <View style={styles.suitabilityBadge}>
                      <MaterialCommunityIcons name="star" size={14} color="#FFA000" />
                      <Text style={styles.suitabilityText}>{crop.suitability} Suitable</Text>
                    </View>
                  )}
                </View>
                {selectedCrop?.id === crop.id && (
                  <MaterialCommunityIcons name="check-circle" size={24} color="#4CAF50" />
                )}
              </View>

              {!crop.isOther && (
                <View style={styles.cropDetails}>
                  <View style={styles.detailItem}>
                    <MaterialCommunityIcons name="water" size={16} color="#0097A7" />
                    <Text style={styles.detailLabel}>Water</Text>
                    <Text style={styles.detailValue}>{crop.waterRequired}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <MaterialCommunityIcons name="flower" size={16} color="#6D4C41" />
                    <Text style={styles.detailLabel}>Soil</Text>
                    <Text style={styles.detailValue}>{crop.soilType}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <MaterialCommunityIcons name="calendar" size={16} color="#D32F2F" />
                    <Text style={styles.detailLabel}>Season</Text>
                    <Text style={styles.detailValue}>{crop.season}</Text>
                  </View>
                  {crop.marketPrice && (
                    <View style={styles.detailItem}>
                      <MaterialCommunityIcons name="currency-inr" size={16} color="#00796B" />
                      <Text style={styles.detailLabel}>Price</Text>
                      <Text style={styles.detailValue}>₹{crop.marketPrice.price}/q</Text>
                    </View>
                  )}
                </View>
              )}
            </TouchableOpacity>
          ))
        )}
      </View>

          <View style={styles.footer} />

      {/* Confirmation Modal - Step 1: Crop Selection */}
      {confirmationStep === 'crop' && (
        <Modal
          visible={showConfirmation}
          transparent={true}
          animationType="fade"
        >
          <View style={styles.modalOverlay}>
            <View style={styles.confirmationModal}>
              <ScrollView showsVerticalScrollIndicator={false}>
                <MaterialCommunityIcons name="sprout" size={48} color="#2E7D32" style={{ marginBottom: 12, alignSelf: 'center' }} />
                <Text style={styles.modalTitle}>Confirm Your Crop</Text>
                <Text style={styles.modalMessage}>
                  Please verify your crop selection:
                </Text>
                
                {/* Crop Selection */}
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#333', marginTop: 15, marginBottom: 8 }}>Crop:</Text>
                {isOtherSelected ? (
                  <>
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g., Carrots, Spinach, etc."
                      placeholderTextColor="#999"
                      value={customCropName}
                      onChangeText={setCustomCropName}
                      autoFocus={true}
                    />
                  </>
                ) : (
                  <View style={{ backgroundColor: '#E8F5E9', padding: 12, borderRadius: 8, marginBottom: 15 }}>
                    <Text style={{ fontSize: 16, fontWeight: '700', color: '#2E7D32' }}>{selectedCrop?.name}</Text>
                  </View>
                )}

                {!isOtherSelected && selectedCrop?.marketPrice && (
                  <View style={{ backgroundColor: '#F1F8E9', padding: 12, borderRadius: 8, marginBottom: 15 }}>
                    <Text style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>Current Market Price:</Text>
                    <Text style={{ fontSize: 16, fontWeight: '700', color: '#558B2F' }}>
                      ₹{typeof selectedCrop.marketPrice === 'object' ? selectedCrop.marketPrice.price : selectedCrop.marketPrice}/quintal
                    </Text>
                  </View>
                )}

                <Text style={styles.warningText}>
                  ⚠️  Once locked, you CANNOT change your crop. Please verify before proceeding.
                </Text>

                <View style={styles.modalButtons}>
                  <TouchableOpacity 
                    style={[styles.modalButton, { backgroundColor: '#E0E0E0' }]}
                    onPress={() => {
                      setShowConfirmation(false);
                      setSelectedCrop(null);
                      setCustomCropName('');
                      setIsOtherSelected(false);
                      setSowingDate(null);                    setManualDateInput('');                      setConfirmationStep('crop');
                    }}
                  >
                    <Text style={[styles.modalButtonText, { color: '#333' }]}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[
                      styles.modalButton, 
                      { 
                        backgroundColor: '#2E7D32',
                        opacity: (isOtherSelected && customCropName.trim() === '') ? 0.5 : 1
                      }
                    ]}
                    onPress={handleContinueToDate}
                    disabled={isOtherSelected && customCropName.trim() === ''}
                  >
                    <Text style={[styles.modalButtonText, { color: 'white' }]}>
                      Continue to Sowing Date
                    </Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}

      {/* Confirmation Modal - Step 2: Sowing Date Selection */}
      {confirmationStep === 'date' && (
        <Modal
          visible={showConfirmation}
          transparent={true}
          animationType="fade"
        >
          <View style={styles.modalOverlay}>
            <View style={styles.confirmationModal}>
              <ScrollView showsVerticalScrollIndicator={false}>
                <MaterialCommunityIcons name="calendar" size={48} color="#D32F2F" style={{ marginBottom: 12, alignSelf: 'center' }} />
                <Text style={styles.modalTitle}>Select Sowing Date</Text>
                <Text style={styles.modalMessage}>
                  When will you sow this crop?
                </Text>
                
                {/* Selected Crop Info */}
                <View style={{ backgroundColor: '#E8F5E9', padding: 12, borderRadius: 8, marginBottom: 15, marginTop: 12 }}>
                  <Text style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>Selected Crop:</Text>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: '#2E7D32' }}>
                    {isOtherSelected ? customCropName : selectedCrop?.name}
                  </Text>
                </View>

                {/* Sowing Date Input */}
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#333', marginTop: 12, marginBottom: 8 }}>Sowing Date (DD-MM-YYYY):</Text>
                
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g., 15-03-2026"
                  placeholderTextColor="#999"
                  value={manualDateInput}
                  onChangeText={handleDateChange}
                  keyboardType="numbers-and-hyphens"
                />
                
                <Text style={{ fontSize: 11, color: '#999', marginTop: 6, marginBottom: 12 }}>
                  Format: DD-MM-YYYY (e.g., 15-03-2026) or YYYY-MM-DD
                </Text>

                {sowingDate && (
                  <View style={{ backgroundColor: '#FFF3E0', padding: 12, borderRadius: 8, marginBottom: 15, borderLeftWidth: 4, borderLeftColor: '#FFA000' }}>
                    <Text style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>Selected Date:</Text>
                    <Text style={{ fontSize: 16, fontWeight: '700', color: '#E65100' }}>
                      📅 {sowingDate.toLocaleDateString('en-IN', { 
                        weekday: 'short', 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </Text>
                  </View>
                )}

                <Text style={styles.warningText}>
                  ⚠️  Once locked, you CANNOT change your sowing date. Please verify before confirming.
                </Text>

                <View style={styles.modalButtons}>
                  <TouchableOpacity 
                    style={[styles.modalButton, { backgroundColor: '#E0E0E0' }]}
                    onPress={handleBackToCrop}
                  >
                    <Text style={[styles.modalButtonText, { color: '#333' }]}>Back</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[
                      styles.modalButton, 
                      { 
                        backgroundColor: '#4CAF50',
                        opacity: !sowingDate ? 0.5 : 1
                      }
                    ]}
                    onPress={handleConfirmSelection}
                    disabled={!sowingDate || loading}
                  >
                    <Text style={[styles.modalButtonText, { color: 'white' }]}>
                      {loading ? 'Locking...' : 'Lock Crop & Date'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
        </>
      )}

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
    paddingVertical: 20,
    paddingHorizontal: 20,
    paddingTop: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcomeHeader: {
    backgroundColor: '#2E7D32',
    paddingVertical: 20,
    paddingHorizontal: 20,
    paddingTop: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcomeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  welcomeText: {
    marginLeft: 16,
  },
  welcomeLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  welcomeName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  cropRecSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#FFF9E6',
    borderLeftWidth: 5,
    borderLeftColor: '#FFA726',
  },
  cropRecLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  mainCard: {
    marginHorizontal: 20,
    marginVertical: 30,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 30,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  mainCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#D32F2F',
    marginBottom: 12,
    textAlign: 'center',
  },
  mainCardDesc: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  viewCropsButton: {
    backgroundColor: '#2E7D32',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
  },
  viewCropsButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    flex: 1,
    textAlign: 'center',
  },
  cropRecommendationCard: {
    backgroundColor: 'white',
    marginHorizontal: 15,
    marginVertical: 20,
    borderRadius: 12,
    padding: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    borderLeftWidth: 5,
    borderLeftColor: '#2E7D32',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardText: {
    marginLeft: 15,
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 6,
  },
  cardDesc: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
    lineHeight: 18,
  },
  cardAction: {
    fontSize: 12,
    color: '#2E7D32',
    fontWeight: '600',
  },
  backButtonSection: {
    marginHorizontal: 15,
    marginVertical: 15,
    marginBottom: 10,
  },
  backButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#F1F8E9',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2E7D32',
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2E7D32',
    marginLeft: 8,
  },
  lockedCard: {
    marginHorizontal: 15,
    marginVertical: 15,
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    padding: 20,
    borderWidth: 2,
    borderColor: '#D32F2F',
    alignItems: 'center',
  },
  lockedTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#D32F2F',
    marginBottom: 10,
  },
  lockedCrop: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 5,
  },
  lockedDate: {
    fontSize: 12,
    color: '#666',
    marginBottom: 15,
  },
  lockedMessage: {
    fontSize: 13,
    color: '#555',
    textAlign: 'center',
    lineHeight: 18,
  },
  infoSection: {
    paddingHorizontal: 15,
    paddingVertical: 15,
  },
  infoBox: {
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: '#1976D2',
  },
  infoText: {
    marginLeft: 12,
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 2,
  },
  infoDesc: {
    fontSize: 12,
    color: '#555',
  },
  section: {
    marginHorizontal: 15,
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 12,
  },
  cropCard: {
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    borderLeftWidth: 5,
    borderLeftColor: '#2E7D32',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  cropHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cropIcon: {
    marginRight: 12,
  },
  cropInfo: {
    flex: 1,
  },
  cropName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 4,
  },
  suitabilityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 160, 0, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  suitabilityText: {
    fontSize: 11,
    color: '#FFA000',
    fontWeight: 'bold',
    marginLeft: 4,
  },
  cropDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailItem: {
    alignItems: 'center',
    flex: 1,
  },
  detailLabel: {
    fontSize: 10,
    color: '#666',
    marginTop: 4,
  },
  detailValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
  },
  actionGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#2E7D32',
    backgroundColor: 'white',
    gap: 6,
  },
  actionButtonText: {
    color: '#2E7D32',
    fontSize: 12,
    fontWeight: 'bold',
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
  footer: {
    height: 30,
  },
  loadingText: {
    fontSize: 16,
    color: '#2E7D32',
    marginTop: 15,
  },
  retryButton: {
    backgroundColor: '#2E7D32',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    marginVertical: 20,
    alignItems: 'center',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  confirmationModal: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 25,
    alignItems: 'center',
    width: '100%',
    maxWidth: 350,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 10,
  },
  modalMessage: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
    marginBottom: 12,
  },
  cropNameDisplay: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginVertical: 15,
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#2E7D32',
    width: '100%',
    textAlign: 'center',
  },
  textInput: {
    borderWidth: 2,
    borderColor: '#2E7D32',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    marginVertical: 15,
    width: '100%',
    color: '#333',
  },
  warningText: {
    fontSize: 12,
    color: '#D32F2F',
    textAlign: 'center',
    marginVertical: 15,
    paddingHorizontal: 10,
    lineHeight: 18,
    backgroundColor: '#FFF3E0',
    paddingVertical: 10,
    borderRadius: 8,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    width: '100%',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});