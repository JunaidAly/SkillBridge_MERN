import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import client from '../api/client';

// Both directions are fetched through the same endpoint and kept side by side,
// so switching tabs doesn't discard the other tab's results or refetch it.
//   learn -> teachers who teach what I want to learn
//   teach -> students who want to learn what I teach
const emptyDirection = {
  recommendations: [],
  method: null,
  generatedAt: null,
  loading: false,
  error: null,
  // Set by the API when the user simply hasn't added the skills this direction
  // needs - distinct from "we found nothing for you".
  reason: null,
  loaded: false,
};

export const fetchRecommendations = createAsyncThunk(
  'recommendations/fetchRecommendations',
  async ({ limit = 10, direction = 'learn' } = {}, { rejectWithValue }) => {
    try {
      const response = await client.get(
        `/recommendations/me?limit=${limit}&direction=${direction}`
      );
      return { direction, data: response.data.data };
    } catch (error) {
      return rejectWithValue({
        direction,
        message: error.response?.data?.message || 'Failed to fetch recommendations',
      });
    }
  }
);

const recommendationsSlice = createSlice({
  name: 'recommendations',
  initialState: {
    learn: { ...emptyDirection },
    teach: { ...emptyDirection },
  },
  reducers: {
    clearRecommendations: (state) => {
      state.learn = { ...emptyDirection };
      state.teach = { ...emptyDirection };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRecommendations.pending, (state, action) => {
        const slot = state[action.meta.arg?.direction || 'learn'];
        slot.loading = true;
        slot.error = null;
      })
      .addCase(fetchRecommendations.fulfilled, (state, action) => {
        const { direction, data } = action.payload;
        state[direction] = {
          recommendations: data.recommendations || [],
          method: data.method,
          generatedAt: data.generated_at,
          loading: false,
          error: null,
          reason: data.reason || null,
          loaded: true,
        };
      })
      .addCase(fetchRecommendations.rejected, (state, action) => {
        const direction = action.payload?.direction || action.meta.arg?.direction || 'learn';
        state[direction] = {
          ...emptyDirection,
          error: action.payload?.message || 'Failed to fetch recommendations',
          loaded: true,
        };
      });
  },
});

export const { clearRecommendations } = recommendationsSlice.actions;
export default recommendationsSlice.reducer;
