import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient, { BASE_URL } from '../constants/api';
import axios from 'axios';

/**
 * Log in with username and password.
 * Stores access/refresh tokens and user info in AsyncStorage.
 * Returns the decoded user payload { role, user_id, username }.
 */
export async function login(username, password) {
    const response = await axios.post(`${BASE_URL}/auth/login/`, { username, password });
    
    // The backend uses DRF Token Authentication.
    // It returns: { token, user: {id, username}, profile: {role, phone_device_id} }
    const { token, user, profile } = response.data;
    
    await AsyncStorage.multiSet([
        ['access_token', token],
        ['user', JSON.stringify({ role: profile.role, user_id: user.id, username: user.username })],
    ]);
    return { role: profile.role, user_id: user.id, username: user.username };
}

export async function register(username, email, password, deviceId, role) {
    const payload = { username, email, password, role };
    // Optionally include deviceId if provided
    if (deviceId) {
        payload.phone_device_id = deviceId;
    }
    const response = await axios.post(`${BASE_URL}/auth/register/`, payload);
    
    const { token, user, profile } = response.data;
    await AsyncStorage.multiSet([
        ['access_token', token],
        ['user', JSON.stringify({ role: profile.role, user_id: user.id, username: user.username })],
    ]);
    return { role: profile.role, user_id: user.id, username: user.username };
}

/** Remove all auth tokens from storage. */
export async function logout() {
    await AsyncStorage.multiRemove(['access_token', 'refresh_token', 'user']);
}

/** Return the currently stored user object, or null. */
export async function getStoredUser() {
    const raw = await AsyncStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
}

/** Fetch the current user profile from /api/users/me/ */
export async function fetchCurrentUser() {
    const response = await apiClient.get('/users/me/');
    return response.data;
}
