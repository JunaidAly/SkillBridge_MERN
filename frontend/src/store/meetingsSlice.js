import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import apiClient from '../api/client';

export const fetchMeetings = createAsyncThunk(
  'meetings/fetch',
  async (_, { rejectWithValue }) => {
    try {
      const res = await apiClient.get('/meetings');
      return res.data.meetings;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load meetings');
    }
  }
);

export const fetchMeetingHistory = createAsyncThunk(
  'meetings/fetchHistory',
  async ({ status, limit } = {}, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      if (status) params.append('status', status);
      if (limit) params.append('limit', limit);
      const res = await apiClient.get(`/meetings/history?${params.toString()}`);
      return res.data.meetings;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load meeting history');
    }
  }
);

export const createMeeting = createAsyncThunk(
  'meetings/create',
  async ({ conversationId, otherUserId, title, startsAt, sessionType, skill, duration }, { rejectWithValue }) => {
    try {
      const res = await apiClient.post('/meetings', {
        conversationId,
        otherUserId,
        title,
        startsAt,
        sessionType,
        skill,
        duration,
      });
      return res.data.meeting;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to create meeting');
    }
  }
);

export const rateMeeting = createAsyncThunk(
  'meetings/rate',
  async ({ meetingId, rating }, { rejectWithValue }) => {
    try {
      const res = await apiClient.post(`/meetings/${meetingId}/rate`, { rating });
      return res.data.meeting;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to rate meeting');
    }
  }
);

export const cancelMeeting = createAsyncThunk(
  'meetings/cancel',
  async (meetingId, { rejectWithValue }) => {
    try {
      const res = await apiClient.post(`/meetings/${meetingId}/cancel`);
      return res.data.meeting;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to cancel meeting');
    }
  }
);

export const deleteMeeting = createAsyncThunk(
  'meetings/delete',
  async (meetingId, { rejectWithValue }) => {
    try {
      await apiClient.delete(`/meetings/${meetingId}`);
      return meetingId;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to delete meeting');
    }
  }
);

const meetingsSlice = createSlice({
  name: 'meetings',
  initialState: {
    meetings: [],
    history: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearMeetingsError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMeetings.pending, (s) => {
        s.loading = true;
        s.error = null;
      })
      .addCase(fetchMeetings.fulfilled, (s, a) => {
        s.loading = false;
        s.meetings = a.payload || [];
      })
      .addCase(fetchMeetings.rejected, (s, a) => {
        s.loading = false;
        s.error = a.payload;
      })
      .addCase(fetchMeetingHistory.fulfilled, (s, a) => {
        s.history = a.payload || [];
      })
      .addCase(createMeeting.fulfilled, (s, a) => {
        s.meetings = [a.payload, ...(s.meetings || [])];
      })
      .addCase(cancelMeeting.fulfilled, (s, a) => {
        s.meetings = s.meetings.filter(m => m._id !== a.payload._id);
      })
      .addCase(deleteMeeting.fulfilled, (s, a) => {
        s.meetings = s.meetings.filter(m => m._id !== a.payload);
        s.history = s.history.filter(m => m._id !== a.payload);
      })
      .addCase(rateMeeting.fulfilled, (s, a) => {
        const idx = s.history.findIndex(m => m._id === a.payload._id);
        if (idx >= 0) {
          s.history[idx] = a.payload;
        }
      });
  },
});

export const { clearMeetingsError } = meetingsSlice.actions;
export default meetingsSlice.reducer;


