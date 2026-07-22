import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { bookingsApi } from '../api/api';

export const fetchBadgeCount = createAsyncThunk(
  'requests/fetchBadgeCount',
  async (userRole, { rejectWithValue }) => {
    if (!localStorage.getItem('token') || userRole !== 'guest') {
      return 0;
    }
    try {
      const response = await bookingsApi.getGuestRequestsCount();
      return response.data.total_count;
    } catch (error) {
      console.error("Redux failed to fetch requests count:", error);
      return 0;
    }
  }
);

const requestsSlice = createSlice({
  name: 'requests',
  initialState: {
    posts: [],
    badgeCount: 0,
    loading: true,
    error: null,
    isMockData: false,
  },
  reducers: {
    setPosts: (state, action) => {
      state.posts = action.payload;
    },
    setBadgeCount: (state, action) => {
      state.badgeCount = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    setIsMockData: (state, action) => {
      state.isMockData = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBadgeCount.fulfilled, (state, action) => {
        state.badgeCount = action.payload;
      });
  },
});

export const {
  setPosts,
  setBadgeCount,
  setLoading,
  setError,
  setIsMockData,
} = requestsSlice.actions;

export default requestsSlice.reducer;
