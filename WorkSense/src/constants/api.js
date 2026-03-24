import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Update BASE_URL to your server's IP / hostname.
// For production builds use an environment variable or expo-constants:
//   import Constants from 'expo-constants';
//   export const BASE_URL = Constants.expoConfig?.extra?.apiUrl ?? 'http://localhost:8000/api';
export const BASE_URL = 'http://localhost:8000/api';

const apiClient = axios.create({
    baseURL: BASE_URL,
    timeout: 10000,
    headers: { 'Content-Type': 'application/json' },
});

// Attach DRF Token to every outgoing request
apiClient.interceptors.request.use(async (config) => {
    const token = await AsyncStorage.getItem('access_token');
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
            await AsyncStorage.multiRemove(['access_token', 'user']);
            // The app state or navigation should ideally handle directing the user to login.
        }
        return Promise.reject(error);
    }
);

export default apiClient;
