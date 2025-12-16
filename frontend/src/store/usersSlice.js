import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import apiClient from '../api/client';

export const fetchUsers = createAsyncThunk(
  'users/fetchUsers',
  async (_, { rejectWithValue, getState }) => {
    try {
      const res = await apiClient.get('/users');
      // Normalize user IDs (_id -> id) and filter out current user
      const currentUserId = getState().auth.user?.id;
      const users = (res.data.users || []).map(user => ({
        ...user,
        id: user.id || user._id, // Normalize _id to id
      })).filter(user => user.id !== currentUserId);
      return users;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load users');
    }
  }
);

const usersSlice = createSlice({
  name: 'users',
  initialState: {
    users: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearUsersError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload || [];
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearUsersError } = usersSlice.actions;
export default usersSlice.reducer;

