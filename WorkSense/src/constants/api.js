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

// Attach JWT access token to every outgoing request
apiClient.interceptors.request.use(async (config) => {
    const token = await AsyncStorage.getItem('access_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Auto-refresh on 401
apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            try {
                const refresh = await AsyncStorage.getItem('refresh_token');
                const res = await axios.post(`${BASE_URL}/auth/refresh/`, { refresh });
                await AsyncStorage.setItem('access_token', res.data.access);
                originalRequest.headers.Authorization = `Bearer ${res.data.access}`;
                return apiClient(originalRequest);
            } catch {
                await AsyncStorage.multiRemove(['access_token', 'refresh_token', 'user']);
            }
        }
        return Promise.reject(error);
    }
);

export default apiClient;
