import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import apiClient from '../api/client';

export const fetchFeedbackReceived = createAsyncThunk(
  'feedback/fetchReceived',
  async (_, { rejectWithValue }) => {
    try {
      const res = await apiClient.get('/feedback/received');
      return res.data.feedbacks;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load feedback received');
    }
  }
);

export const fetchFeedbackGiven = createAsyncThunk(
  'feedback/fetchGiven',
  async (_, { rejectWithValue }) => {
    try {
      const res = await apiClient.get('/feedback/given');
      return res.data.feedbacks;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load feedback given');
    }
  }
);

export const fetchPendingSessions = createAsyncThunk(
  'feedback/fetchPending',
  async (_, { rejectWithValue }) => {
    try {
      const res = await apiClient.get('/feedback/pending');
      return res.data.pending;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load pending sessions');
    }
  }
);

export const submitFeedback = createAsyncThunk(
  'feedback/submit',
  async ({ toUserId, meetingId, skill, rating, comment }, { rejectWithValue }) => {
    try {
      const res = await apiClient.post('/feedback', {
        toUserId,
        meetingId,
        skill,
        rating,
        comment,
      });
      return res.data.feedback;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to submit feedback');
    }
  }
);

const feedbackSlice = createSlice({
  name: 'feedback',
  initialState: {
    feedbackReceived: [],
    feedbackGiven: [],
    pendingSessions: [],
    loading: false,
    submitting: false,
    error: null,
  },
  reducers: {
    clearFeedbackError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFeedbackReceived.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFeedbackReceived.fulfilled, (state, action) => {
        state.loading = false;
        state.feedbackReceived = action.payload || [];
      })
      .addCase(fetchFeedbackReceived.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchFeedbackGiven.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFeedbackGiven.fulfilled, (state, action) => {
        state.loading = false;
        state.feedbackGiven = action.payload || [];
      })
      .addCase(fetchFeedbackGiven.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchPendingSessions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPendingSessions.fulfilled, (state, action) => {
        state.loading = false;
        state.pendingSessions = action.payload || [];
      })
      .addCase(fetchPendingSessions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(submitFeedback.pending, (state) => {
        state.submitting = true;
        state.error = null;
      })
      .addCase(submitFeedback.fulfilled, (state, action) => {
        state.submitting = false;
        // Add to feedback given list
        const feedback = {
          id: action.payload._id,
          name: action.payload.toUser?.name || 'Unknown',
          avatar: action.payload.toUser?.avatar || null,
          type: 'You rated',
          rating: action.payload.rating,
          date: new Date(action.payload.createdAt).toISOString().split('T')[0],
          comment: action.payload.comment,
          skill: action.payload.skill,
        };
        state.feedbackGiven = [feedback, ...state.feedbackGiven];
        // Remove from pending sessions
        if (action.payload.meeting) {
          state.pendingSessions = state.pendingSessions.filter(
            (s) => s.meetingId !== action.payload.meeting._id
          );
        }
      })
      .addCase(submitFeedback.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.payload;
      });
  },
});

export const { clearFeedbackError } = feedbackSlice.actions;
export default feedbackSlice.reducer;

