import { createSlice } from '@reduxjs/toolkit';

const presenceSlice = createSlice({
  name: 'presence',
  initialState: {
    onlineUserIds: [],
    lastSeenByUser: {},
  },
  reducers: {
    setOnlineUsers: (state, action) => {
      state.onlineUserIds = action.payload || [];
    },
    userWentOnline: (state, action) => {
      const userId = String(action.payload);
      if (!state.onlineUserIds.includes(userId)) {
        state.onlineUserIds.push(userId);
      }
    },
    userWentOffline: (state, action) => {
      const { userId, lastSeen } = action.payload;
      state.onlineUserIds = state.onlineUserIds.filter((id) => id !== String(userId));
      if (lastSeen) {
        state.lastSeenByUser[String(userId)] = lastSeen;
      }
    },
  },
});

export const { setOnlineUsers, userWentOnline, userWentOffline } = presenceSlice.actions;
export default presenceSlice.reducer;
