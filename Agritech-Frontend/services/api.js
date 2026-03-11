// API Configuration
// For development/simulator: use localhost:5000
// For real device: use your computer IP (get from: ipconfig)
const BASE_URL = "http://localhost:5000/farmers";
const API_URL = "http://localhost:5000";

// Export for use in components
export { API_URL, BASE_URL };

let authToken = null; // Store JWT token in memory

// Function to set token after login
export const setAuthToken = (token) => {
  authToken = token;
};

// Function to get token for authenticated requests
export const getAuthToken = () => {
  return authToken;
};

// Function to clear token on logout
export const clearAuthToken = () => {
  authToken = null;
};

export const signupUser = async (data) => {
  try {
    console.log("Attempting signup with URL:", `${BASE_URL}/signup`);
    const res = await fetch(`${BASE_URL}/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ message: "Unknown error" }));
      throw new Error(errorData.message || `HTTP ${res.status}: Signup failed`);
    }

    return res.json();
  } catch (error) {
    console.error("❌ Signup error:", error);
    throw new Error(error.message || "Network request failed - Backend not responding");
  }
};

export const loginUser = async (data) => {
  try {
    console.log("Attempting login with URL:", `${BASE_URL}/login`);
    const res = await fetch(`${BASE_URL}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ message: "Unknown error" }));
      throw new Error(errorData.message || `HTTP ${res.status}: Login failed`);
    }

    const result = await res.json();
    
    if (result.token) {
      setAuthToken(result.token);
    }

    return result;
  } catch (error) {
    console.error("❌ Login error:", error);
    throw new Error(error.message || "Network request failed - Backend not responding");
  }
};

export const updateFarmerProfile = async (id, data) => {
  const token = getAuthToken(); // Grab the token you saved during login
  
  const res = await fetch(`${BASE_URL}/update/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      // Send the token in the headers so the backend knows you are logged in
      "Authorization": token ? `Bearer ${token}` : "" 
    },
    body: JSON.stringify(data)
  });

  if (!res.ok) {
    throw new Error("Failed to update profile");
  }

  return res.json();
};

export const getFarmerProfile = async (id) => {
  const res = await fetch(`${BASE_URL}/${id}`, { method: "GET" });
  if (!res.ok) throw new Error("Failed to fetch farmer data");
  return res.json();
};