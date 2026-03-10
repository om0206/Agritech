// Change "192.168.1.14" to your computer's IP for mobile testing
// On web/simulator: http://localhost:5000
// On real phone: http://YOUR_COMPUTER_IP:5000
const BASE_URL = "http://192.168.1.14:5000/farmers";
const API_URL = "http://192.168.1.14:5000";

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
  const res = await fetch(`${BASE_URL}/signup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  });

  if (!res.ok) {
    throw new Error("Signup failed");
  }

  return res.json();
};

export const loginUser = async (data) => {
  const res = await fetch(`${BASE_URL}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  });

  if (!res.ok) {
    throw new Error("Login failed");
  }

  const result = await res.json();
  
  // Store token after successful login - await properly here
  if (result.token) {
    setAuthToken(result.token);
  }

  return result;
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