import { View, Text, ScrollView, StyleSheet, ActivityIndicator, FlatList, TouchableOpacity, Linking } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { getAuthToken, API_URL } from "../../services/api";

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

export default function SchemesPage() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [investment, setInvestment] = useState(0);
  const [username, setUsername] = useState("");

  useEffect(() => {
    // First try to get farmer data from params
    if (params.farmer) {
      try {
        const farmerData = JSON.parse(params.farmer);
        setUsername(farmerData.username);
        const investmentAmount = parseInt(farmerData.investment) || 0;
        setInvestment(investmentAmount);
        fetchSchemes();
      } catch (error) {
        console.log("Error parsing farmer data:", error);
        // Fallback to fetching from token
        fetchFarmerDataAndSchemes();
      }
    } else {
      // If no params, fetch from backend using token
      fetchFarmerDataAndSchemes();
    }
  }, [params.farmer]);

  const fetchFarmerDataAndSchemes = async () => {
    try {
      const token = await getAuthToken();
      if (!token) {
        console.log("No token found");
        setLoading(false);
        return;
      }

      // Decode JWT to get farmer ID
      const decoded = decodeToken(token);
      const farmerId = decoded?.id;

      if (!farmerId) {
        console.log("Invalid token");
        setLoading(false);
        return;
      }

      // Fetch farmer profile
      const response = await fetch(`${API_URL}/farmers/${farmerId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const farmerData = await response.json();
        setUsername(farmerData.username);
        const investmentAmount = parseInt(farmerData.investment) || 0;
        setInvestment(investmentAmount);
      }

      // Then fetch schemes
      fetchSchemes();
    } catch (error) {
      console.error('Error fetching farmer data:', error);
      fetchSchemes();
    }
  };

  const fetchSchemes = async () => {
    try {
      setLoading(true);
      // Try to fetch schemes from backend
      const res = await fetch(`${API_URL}/schemes/live`);
      const data = await res.json();
      
      console.log("API Response:", JSON.stringify(data, null, 2));
      
      if (data.success || Array.isArray(data)) {
        const schemesData = data.success ? data.data : data;
        console.log("Setting schemes from backend:", JSON.stringify(schemesData, null, 2));
        setSchemes(schemesData);
      } else {
        // Use default schemes if API fails
        console.log("Using default schemes");
        setSchemes(getDefaultSchemes());
      }
    } catch (error) {
      console.log("Error fetching schemes:", error);
      // Fallback to default schemes
      setSchemes(getDefaultSchemes());
    } finally {
      setLoading(false);
    }
  };

  const getDefaultSchemes = () => {
    return [
      {
        id: "101",
        title: "PM-Kisan Samman Nidhi",
        description: "₹6,000 per year direct to your bank account",
        minInvestment: 0,
        maxInvestment: 1000000,
        url: "https://pmkisan.gov.in/",
        launchDate: "2019"
      },
      {
        id: "102",
        title: "Agri-Infrastructure Fund",
        description: "Up to 3% interest subvention on loans for infrastructure",
        minInvestment: 50000,
        maxInvestment: 10000000,
        url: "https://agriinfrastructure.iifc.org/",
        launchDate: "2020"
      },
      {
        id: "103",
        title: "Pradhan Mantri Fasal Bima Yojana",
        description: "Crop insurance with financial support coverage",
        minInvestment: 0,
        maxInvestment: 5000000,
        url: "https://pmfby.gov.in/",
        launchDate: "2016"
      },
      {
        id: "104",
        title: "Kisan Credit Card (KCC)",
        description: "Quick access to short-term credit for agricultural needs",
        minInvestment: 10000,
        maxInvestment: 500000,
        url: "https://vikaspedia.in/agriculture/kcc",
        launchDate: "1998"
      },
      {
        id: "105",
        title: "Soil Health Card Scheme",
        description: "Free soil testing and fertilizer recommendations",
        minInvestment: 0,
        maxInvestment: 100000,
        url: "https://www.soilhealth.dac.gov.in/",
        launchDate: "2015"
      },
      {
        id: "106",
        title: "Paramparagat Krishi Vikas Yojana",
        description: "Organic farming subsidy and certification support",
        minInvestment: 0,
        maxInvestment: 2000000,
        url: "https://pgsindia-ncof.gov.in/",
        launchDate: "2015"
      }
    ];
  };

  // Filter schemes based on user's investment
  const filteredSchemes = schemes.filter(scheme => {
    return investment >= (scheme.minInvestment || 0) && 
           investment <= (scheme.maxInvestment || 10000000);
  });

  const renderSchemeCard = ({ item }) => {
    console.log("Rendering scheme:", item.title, "URL:", item.url);
    return (
      <View style={styles.schemeCard}>
        <Text style={styles.schemeTitle}>{item.title}</Text>
        <Text style={styles.schemeDescription}>{item.description}</Text>
        
        {item.launchDate && (
          <Text style={styles.launchDate}>📅 Launched: {item.launchDate}</Text>
        )}
        
        <View style={styles.schemeFooter}>
          <Text style={styles.investmentRange}>
            Min: ₹{item.minInvestment ? item.minInvestment.toLocaleString() : "0"}
          </Text>
          <Text style={styles.investmentRange}>
            Max: ₹{item.maxInvestment ? item.maxInvestment.toLocaleString() : "Unlimited"}
          </Text>
        </View>

        {item.url ? (
          <TouchableOpacity 
            style={styles.urlButton}
            onPress={() => {
              console.log("Opening URL:", item.url);
              Linking.openURL(item.url);
            }}
          >
            <Text style={styles.urlLink}>🔗 Visit Official Website</Text>
          </TouchableOpacity>
        ) : (
          <Text style={{ color: "#999", fontSize: 12, marginTop: 8 }}>URL not available</Text>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading available schemes...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Hi {username}! 👋</Text>
      <Text style={styles.subtitle}>Government Schemes for You</Text>

      <View style={styles.investmentCard}>
        <Text style={styles.investmentLabel}>Your Investment Budget:</Text>
        <Text style={styles.investmentAmount}>
          ₹{investment.toLocaleString() || "0"}
        </Text>
      </View>

      {filteredSchemes.length > 0 ? (
        <>
          <Text style={styles.matchCount}>
            {filteredSchemes.length} schemes match your profile
          </Text>
          <FlatList
            data={filteredSchemes}
            renderItem={renderSchemeCard}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
          />
        </>
      ) : (
        <View style={styles.noSchemesContainer}>
          <Text style={styles.noSchemesText}>
            No schemes match your current investment level.
          </Text>
          <Text style={styles.noSchemesHint}>
            Update your investment budget in your profile to see more schemes.
          </Text>
        </View>
      )}

      <View style={styles.actionButtons}>
        <View style={styles.buttonWrapper}>
          <Text style={styles.buttonText} onPress={() => router.push("/(tabs)/home")}>
            View Schemes & Go to Dashboard
          </Text>
        </View>

        <View style={styles.skipButtonWrapper}>
          <Text style={styles.skipButtonText} onPress={() => router.replace("/(tabs)/home")}>
            Skip Schemes
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  header: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    marginTop: 20,
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 20,
  },
  investmentCard: {
    backgroundColor: "#4CAF50",
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
  },
  investmentLabel: {
    fontSize: 14,
    color: "#fff",
    opacity: 0.9,
  },
  investmentAmount: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
    marginTop: 5,
  },
  matchCount: {
    fontSize: 14,
    color: "#666",
    marginBottom: 15,
    fontWeight: "600",
  },
  schemeCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  schemeTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  schemeDescription: {
    fontSize: 13,
    color: "#666",
    lineHeight: 18,
    marginBottom: 10,
  },
  launchDate: {
    fontSize: 12,
    color: "#666",
    marginBottom: 10,
    fontWeight: "500",
  },
  schemeFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  urlButton: {
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#0066cc",
    borderRadius: 6,
  },
  urlLink: {
    fontSize: 13,
    color: "#fff",
    fontWeight: "600",
    textAlign: "center",
  },
  investmentRange: {
    fontSize: 12,
    color: "#4CAF50",
    fontWeight: "600",
  },
  noSchemesContainer: {
    backgroundColor: "#fff",
    padding: 30,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
  },
  noSchemesText: {
    fontSize: 16,
    color: "#333",
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 10,
  },
  noSchemesHint: {
    fontSize: 13,
    color: "#999",
    textAlign: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: "#666",
  },
  actionButtons: {
    marginTop: 30,
    marginBottom: 30,
    gap: 12,
  },
  buttonWrapper: {
    backgroundColor: "#4CAF50",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  skipButtonWrapper: {
    backgroundColor: "#f0f0f0",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#ddd",
  },
  skipButtonText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "600",
  },
});
