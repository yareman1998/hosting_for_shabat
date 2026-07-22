import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { postsApi } from '../api/api';

export const fetchPosts = createAsyncThunk(
  'requests/fetchPosts',
  async (_, { rejectWithValue }) => {
    try {
      const response = await postsApi.getOpenPosts();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || 'שגיאה בטעינת הבקשות');
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
  },
  reducers: {
    setPosts: (state, action) => {
      state.posts = action.payload;
      state.badgeCount = action.payload.length;
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
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPosts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPosts.fulfilled, (state, action) => {
        state.posts = action.payload;
        state.badgeCount = action.payload.length;
        state.loading = false;
      })
      .addCase(fetchPosts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const {
  setPosts,
  setBadgeCount,
  setLoading,
  setError,
} = requestsSlice.actions;

export default requestsSlice.reducer;
