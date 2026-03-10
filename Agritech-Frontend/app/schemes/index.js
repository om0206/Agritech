import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Linking } from "react-native";
import { useState, useEffect } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";

export default function Schemes() {
  const router = useRouter();
  
  // 1. Grab the parameters passed from the URL
  const params = useLocalSearchParams(); 
  
  // 2. Parse farmer data and extract investment
  const [userBudget, setUserBudget] = useState(0);
  const [farmerData, setFarmerData] = useState(null);
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Parse farmer data when component loads
  useEffect(() => {
    if (params.farmer) {
      try {
        const farmer = JSON.parse(params.farmer);
        setFarmerData(farmer);
        const budget = parseInt(farmer.investment) || 0;
        setUserBudget(budget);
        console.log("Budget received in Schemes screen:", budget);
      } catch (error) {
        console.log("Error parsing farmer data:", error);
        setUserBudget(0);
      }
    }
  }, [params.farmer]);

  useEffect(() => {
    // Only fetch schemes when we have a valid budget
    if (userBudget === 0) return;
    
    const fetchSchemes = async () => {
      try {
        // IMPORTANT: Make sure this IP matches your actual computer IP!
        const res = await fetch("http://192.168.1.14:5000/schemes/live");
        const json = await res.json();
        
        if (json.success) {
          console.log("Backend data received:", JSON.stringify(json.data, null, 2));
          // FLEXIBLE BUDGET FILTERING LOGIC
          const filteredSchemes = json.data.filter(scheme => {
            const minInvest = scheme.minInvestment || 0;
            
            // Show scheme if farmer has at least the minimum investment required
            // Don't filter by max - most schemes can accommodate higher budgets
            return userBudget >= minInvest;
          });

          console.log("Filtered schemes after filtering:", JSON.stringify(filteredSchemes, null, 2));
          setSchemes(filteredSchemes);
        }
      } catch (error) {
        console.log("Error fetching schemes:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSchemes();
  }, [userBudget]);

  const renderSchemeCard = ({ item }) => {
    console.log("Rendering scheme:", item.title, "URL:", item.url);
    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <Text style={styles.cardText}>{item.description}</Text>
        
        <View style={styles.budgetTags}>
          {item.minInvestment > 0 && <Text style={styles.reqText}>Min: ₹{item.minInvestment}</Text>}
          {item.maxInvestment && <Text style={styles.reqText}>Max: ₹{item.maxInvestment}</Text>}
        </View>

        {item.launchDate && (
          <Text style={styles.dateText}>📅 Launched: {item.launchDate}</Text>
        )}

        {item.url ? (
          <TouchableOpacity 
            style={styles.linkButton}
            onPress={() => {
              console.log("Opening URL:", item.url);
              Linking.openURL(item.url);
            }}
          >
            <Text style={styles.linkText}>🔗 Visit Official Website</Text>
          </TouchableOpacity>
        ) : (
          <Text style={{ color: "#999", fontSize: 12, marginTop: 8 }}>URL not available</Text>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tailored Schemes</Text>
      <Text style={styles.subtitle}>
        Showing strict matches for your budget of ₹{userBudget}
      </Text>

      {loading ? (
        <ActivityIndicator size="large" color="#2e7d32" style={{ marginTop: 50 }} />
      ) : schemes.length > 0 ? (
        <FlatList
          data={schemes}
          keyExtractor={(item) => item.id}
          renderItem={renderSchemeCard}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      ) : (
        <Text style={styles.noResultsText}>No schemes perfectly match your current budget.</Text>
      )}

      <TouchableOpacity 
        style={styles.button} 
        onPress={() => router.replace({
          pathname: "/(tabs)/home",
          params: { farmer: JSON.stringify(farmerData) }
        })}
      >
        <Text style={styles.buttonText}>Back to Home Dashboard</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 5, marginTop: 20, color: "#2e7d32" },
  subtitle: { fontSize: 16, color: "#555", marginBottom: 15 },
  card: { backgroundColor: "#f4fdf4", padding: 15, borderRadius: 8, marginBottom: 12, borderWidth: 1, borderColor: "#c3e6c3" },
  cardTitle: { fontSize: 18, fontWeight: "bold", color: "#1b5e20", marginBottom: 5 },
  cardText: { fontSize: 14, color: "#333", marginBottom: 10 },
  budgetTags: { flexDirection: "row", gap: 15, marginBottom: 10 },
  reqText: { fontSize: 12, color: "#d32f2f", fontWeight: "bold", backgroundColor: "#ffebee", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  dateText: { fontSize: 12, color: "#666", marginBottom: 8, fontWeight: "500" },
  linkButton: { backgroundColor: "#2e7d32", padding: 10, borderRadius: 6, marginTop: 8 },
  linkText: { color: "#fff", fontSize: 13, fontWeight: "bold", textAlign: "center" },
  noResultsText: { fontSize: 16, color: "#d32f2f", textAlign: "center", marginTop: 20 },
  button: { backgroundColor: "#2e7d32", padding: 15, borderRadius: 8, alignItems: "center", marginTop: 20, marginBottom: 20 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "bold" }
});