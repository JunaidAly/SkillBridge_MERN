import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import profileReducer from './profileSlice';
import chatReducer from './chatSlice';
import meetingsReducer from './meetingsSlice';
import usersReducer from './usersSlice';
import feedbackReducer from './feedbackSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    profile: profileReducer,
    chat: chatReducer,
    meetings: meetingsReducer,
    users: usersReducer,
    feedback: feedbackReducer,
  },
});

export default store;

