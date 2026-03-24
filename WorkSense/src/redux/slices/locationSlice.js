import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  latitude: null,
  longitude: null,
  accuracy: null,
  timestamp: null,
  isTracking: false,
  error: null,
  vpnDetected: false,
  devModeDetected: false,
};

const locationSlice = createSlice({
  name: 'location',
  initialState,
  reducers: {
    setLocation: (state, action) => {
      const { latitude, longitude, accuracy, timestamp } = action.payload;
      state.latitude = latitude;
      state.longitude = longitude;
      state.accuracy = accuracy || null;
      state.timestamp = timestamp || new Date().toISOString();
    },
    setTracking: (state, action) => {
      state.isTracking = action.payload;
    },
    setVpnDetected: (state, action) => {
      state.vpnDetected = action.payload;
    },
    setDevModeDetected: (state, action) => {
      state.devModeDetected = action.payload;
    },
    setLocationError: (state, action) => {
      state.error = action.payload;
    },
    clearLocation: (state) => {
      state.latitude = null;
      state.longitude = null;
      state.accuracy = null;
      state.isTracking = false;
    },
  },
});

export const {
  setLocation,
  setTracking,
  setVpnDetected,
  setDevModeDetected,
  setLocationError,
  clearLocation,
} = locationSlice.actions;

export default locationSlice.reducer;
