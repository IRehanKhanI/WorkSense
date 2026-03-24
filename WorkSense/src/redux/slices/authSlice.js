import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as authApi from "../../services/authApi";

export const loginAsync = createAsyncThunk(
  "auth/login",
  async ({ username, password, deviceId }, { rejectWithValue }) => {
    try {
      const response = await authApi.login(username, password, deviceId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  },
);

export const registerAsync = createAsyncThunk(
  "auth/register",
  async (
    { username, email, password, deviceId, role },
    { rejectWithValue },
  ) => {
    try {
      const response = await authApi.register(
        username,
        email,
        password,
        deviceId,
        role,
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  },
);

const initialState = {
  token: null,
  user: null,
  profile: null,
  isAuthenticated: false,
  loading: false,
  error: null,
  role: null,
  deviceId: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout: (state) => {
      state.token = null;
      state.user = null;
      state.profile = null;
      state.isAuthenticated = false;
      state.role = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.profile = action.payload.profile;
        state.isAuthenticated = true;
        state.role = action.payload.profile?.role;
        state.deviceId = action.payload.profile?.phone_device_id;
      })
      .addCase(loginAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
      })
      .addCase(registerAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.profile = action.payload.profile;
        state.isAuthenticated = true;
        state.role = action.payload.profile?.role;
        state.deviceId = action.payload.profile?.phone_device_id;
      })
      .addCase(registerAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;
