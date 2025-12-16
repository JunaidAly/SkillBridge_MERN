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

export const createMeeting = createAsyncThunk(
  'meetings/create',
  async ({ conversationId, otherUserId, title, startsAt }, { rejectWithValue }) => {
    try {
      const res = await apiClient.post('/meetings', { conversationId, otherUserId, title, startsAt });
      return res.data.meeting;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to create meeting');
    }
  }
);

const meetingsSlice = createSlice({
  name: 'meetings',
  initialState: { meetings: [], loading: false, error: null },
  reducers: {},
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
      .addCase(createMeeting.fulfilled, (s, a) => {
        s.meetings = [a.payload, ...(s.meetings || [])];
      });
  },
});

export default meetingsSlice.reducer;


