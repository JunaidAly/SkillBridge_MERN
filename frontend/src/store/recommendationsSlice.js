import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import client from '../api/client';

// Async thunk to fetch AI recommendations
export const fetchRecommendations = createAsyncThunk(
  'recommendations/fetchRecommendations',
  async ({ limit = 10 }, { rejectWithValue }) => {
    try {
      const response = await client.get(`/recommendations/me?limit=${limit}`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch recommendations'
      );
    }
  }
);

const recommendationsSlice = createSlice({
  name: 'recommendations',
  initialState: {
    recommendations: [],
    method: null,
    generatedAt: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearRecommendations: (state) => {
      state.recommendations = [];
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRecommendations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRecommendations.fulfilled, (state, action) => {
        state.loading = false;
        state.recommendations = action.payload.recommendations || [];
        state.method = action.payload.method;
        state.generatedAt = action.payload.generated_at;
        state.error = null;
      })
      .addCase(fetchRecommendations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.recommendations = [];
        state.method = null;
        state.generatedAt = null;
      });
  },
});

export const { clearRecommendations } = recommendationsSlice.actions;
export default recommendationsSlice.reducer;
