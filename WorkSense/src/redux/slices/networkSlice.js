import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  isOnline: true,
  queuedRequests: [], // [{method, url, data, timestamp}]
};

const networkSlice = createSlice({
  name: 'network',
  initialState,
  reducers: {
    setOnline: (state, action) => {
      state.isOnline = action.payload;
    },
    addQueuedRequest: (state, action) => {
      state.queuedRequests.push({
        ...action.payload,
        timestamp: new Date().toISOString(),
      });
    },
    removeQueuedRequest: (state, action) => {
      state.queuedRequests = state.queuedRequests.filter(
        (req, index) => index !== action.payload
      );
    },
    clearQueuedRequests: (state) => {
      state.queuedRequests = [];
    },
  },
});

export const {
  setOnline,
  addQueuedRequest,
  removeQueuedRequest,
  clearQueuedRequests,
} = networkSlice.actions;

export default networkSlice.reducer;
