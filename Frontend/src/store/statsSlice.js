import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
// import api from '../api/api'; // Uncomment this when the backend route is ready

export const fetchDashboardStats = createAsyncThunk(
  'stats/fetchDashboardStats',
  async (_, { rejectWithValue }) => {
    try {
      // TODO: Replace this simulated delay with your actual FastAPI call:
      // const response = await api.get('/stats/guest-dashboard');
      // return response.data;

      // Simulated network request for prototyping
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            availableHosts: 12,
            availableSpots: 34,
            openRequests: 3,
            hostsWithSleepover: 7
          });
        }, 800); 
      });
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch stats');
    }
  }
);

const statsSlice = createSlice({
  name: 'stats',
  initialState: {
    data: {
      availableHosts: 0,
      availableSpots: 0,
      openRequests: 0,
      hostsWithSleepover: 0
    },
    status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
    error: null
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardStats.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchDashboardStats.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.data = action.payload;
      })
      .addCase(fetchDashboardStats.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      });
  }
});

export default statsSlice.reducer;