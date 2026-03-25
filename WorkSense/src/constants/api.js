import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { Platform } from 'react-native';

// Dynamically use the correct IP for Django's server.
// If you are testing on a physical device on your same Wi-Fi, you MUST run Django via:
// python manage.py runserver 0.0.0.0:8000
export const BASE_URL = "http://192.168.137.1:8080/api";

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});

// Attach DRF Token to every outgoing request
apiClient.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Token ${token}`;
  }
  return config;
});

// Logout on 401 Unauthorized since DRF Token doesn't support automatic refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.multiRemove(["access_token", "user"]);
      // The app state or navigation should ideally handle directing the user to login.
    }
    return Promise.reject(error);
  },
);

export default apiClient;
