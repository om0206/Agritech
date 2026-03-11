import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

/**
 * CropRecommendationsCard Component
 * 
 * Displays a card with crop recommendation suggestions and a link to view detailed crops.
 * 
 * @param {Function} onViewCrops - Callback function when "VIEW CROPS" button is pressed
 * @param {Boolean} visible - Controls whether the card is displayed
 * 
 * @example
 * <CropRecommendationsCard 
 *   onViewCrops={handleCropRecommendation}
 *   visible={showMenu}
 * />
 */
const CropRecommendationsCard = ({ onViewCrops, visible = true }) => {
  if (!visible) return null;

  return (
    <View style={styles.section}>
      {/* Header */}
      <View style={styles.sectionHeader}>
        <MaterialCommunityIcons name="sprout" size={20} color="#2E7D32" />
        <Text style={styles.sectionTitle}>Crop Recommendations</Text>
      </View>

      {/* Card */}
      <View style={styles.schemeCard}>
        {/* Icon */}
        <MaterialCommunityIcons name="flower-tulip" size={40} color="#4CAF50" />
        
        {/* Title */}
        <Text style={styles.schemeTitle}>Personalized Crop Suggestions</Text>
        
        {/* Description */}
        <Text style={styles.schemeDesc}>
          Get AI-powered crop recommendations based on your soil, water availability, and location.
        </Text>
        
        {/* View Crops Button */}
        <TouchableOpacity 
          style={styles.exploreButton}
          onPress={onViewCrops}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="leaf" size={20} color="white" />
          <Text style={styles.exploreButtonText}>VIEW CROPS</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginHorizontal: 15,
    marginBottom: 25,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginLeft: 8,
  },
  schemeCard: {
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: '#FFA000',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.1)',
  },
  schemeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E65100',
    marginTop: 12,
    marginBottom: 8,
  },
  schemeDesc: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 18,
  },
  exploreButton: {
    backgroundColor: '#2E7D32',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 160,
  },
  exploreButtonText: {
    color: 'white',
    fontSize: 13,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default CropRecommendationsCard;
