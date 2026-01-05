import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import profileReducer from './profileSlice';
import chatReducer from './chatSlice';
import meetingsReducer from './meetingsSlice';
import usersReducer from './usersSlice';
import feedbackReducer from './feedbackSlice';
import creditsReducer from './creditsSlice';
import recommendationsReducer from './recommendationsSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    profile: profileReducer,
    chat: chatReducer,
    meetings: meetingsReducer,
    users: usersReducer,
    feedback: feedbackReducer,
    credits: creditsReducer,
    recommendations: recommendationsReducer,
  },
});

export default store;

