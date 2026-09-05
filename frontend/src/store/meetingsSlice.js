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

export const fetchMeetingById = createAsyncThunk(
  'meetings/fetchById',
  async (meetingId, { rejectWithValue }) => {
    try {
      const res = await apiClient.get(`/meetings/${meetingId}`);
      return {
        ...res.data.meeting,
        videoRoomName: res.data.videoRoomName,
        jaasToken: res.data.jaasToken,
      };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load meeting');
    }
  }
);

export const fetchMeetingHistory = createAsyncThunk(
  'meetings/fetchHistory',
  async ({ status, limit, page } = {}, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      if (status) params.append('status', status);
      if (limit) params.append('limit', limit);
      if (page) params.append('page', page);
      const res = await apiClient.get(`/meetings/history?${params.toString()}`);
      return {
        meetings: res.data.meetings,
        page: res.data.page,
        totalPages: res.data.totalPages,
      };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load meeting history');
    }
  }
);

export const createMeeting = createAsyncThunk(
  'meetings/create',
  async ({ conversationId, otherUserId, title, startsAt, sessionType, skill, duration, useFreeTrialSession }, { rejectWithValue }) => {
    try {
      const res = await apiClient.post('/meetings', {
        conversationId,
        otherUserId,
        title,
        startsAt,
        sessionType,
        skill,
        duration,
        useFreeTrialSession,
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

export const reportMeetingIssue = createAsyncThunk(
  'meetings/reportIssue',
  async ({ meetingId, reason }, { rejectWithValue }) => {
    try {
      const res = await apiClient.post(`/meetings/${meetingId}/report-issue`, { reason });
      return { meetingId, dispute: res.data.dispute };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to report issue');
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
    historyPage: 1,
    historyTotalPages: 1,
    historyLoading: false,
    loading: false,
    error: null,
    currentMeeting: null,
    currentMeetingLoading: false,
    currentMeetingError: null,
  },
  reducers: {
    clearMeetingsError: (state) => {
      state.error = null;
    },
    clearCurrentMeeting: (state) => {
      state.currentMeeting = null;
      state.currentMeetingError = null;
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
      .addCase(fetchMeetingById.pending, (s) => {
        s.currentMeetingLoading = true;
        s.currentMeetingError = null;
      })
      .addCase(fetchMeetingById.fulfilled, (s, a) => {
        s.currentMeetingLoading = false;
        s.currentMeeting = a.payload;
      })
      .addCase(fetchMeetingById.rejected, (s, a) => {
        s.currentMeetingLoading = false;
        s.currentMeetingError = a.payload;
      })
      .addCase(fetchMeetingHistory.pending, (s) => {
        s.historyLoading = true;
      })
      .addCase(fetchMeetingHistory.fulfilled, (s, a) => {
        s.historyLoading = false;
        s.history = a.payload.meetings || [];
        s.historyPage = a.payload.page || 1;
        s.historyTotalPages = a.payload.totalPages || 1;
      })
      .addCase(fetchMeetingHistory.rejected, (s) => {
        s.historyLoading = false;
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
      })
      .addCase(reportMeetingIssue.fulfilled, (s, a) => {
        const idx = s.history.findIndex(m => m._id === a.payload.meetingId);
        if (idx >= 0) {
          s.history[idx].dispute = a.payload.dispute;
        }
      });
  },
});

export const { clearMeetingsError, clearCurrentMeeting } = meetingsSlice.actions;
export default meetingsSlice.reducer;


