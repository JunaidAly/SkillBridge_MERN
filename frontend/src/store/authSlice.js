import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import apiClient from '../api/client';

const storedAuth = (() => {
  try {
    return JSON.parse(localStorage.getItem('auth')) || null;
  } catch (err) {
    return null;
  }
})();

const initialState = {
  user: storedAuth?.user || null,
  token: storedAuth?.token || null,
  loading: false,
  error: null,
};

export const registerUser = createAsyncThunk(
  'auth/register',
  async ({ name, email, password }, { rejectWithValue }) => {
    try {
      const res = await apiClient.post('/auth/register', { name, email, password });
      return res.data;
    } catch (err) {
      const message = err.response?.data?.message || 'Registration failed';
      return rejectWithValue(message);
    }
  }
);

export const loginUser = createAsyncThunk(
  'auth/login',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const res = await apiClient.post('/auth/login', { email, password });
      return res.data;
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed';
      return rejectWithValue(message);
    }
  }
);

export const loginWithGoogle = createAsyncThunk(
  'auth/google',
  async (googleData, { rejectWithValue }) => {
    try {
      const res = await apiClient.post('/auth/google', {
        tokenId: googleData.credential,
        email: googleData.email,
        name: googleData.name,
        googleId: googleData.sub,
      });
      return res.data;
    } catch (err) {
      const message = err.response?.data?.message || 'Google login failed';
      return rejectWithValue(message);
    }
  }
);

export const loginWithFacebook = createAsyncThunk(
  'auth/facebook',
  async (facebookData, { rejectWithValue }) => {
    try {
      const res = await apiClient.post('/auth/facebook', {
        accessToken: facebookData.accessToken,
        email: facebookData.email,
        name: facebookData.name,
        facebookId: facebookData.userID,
        userID: facebookData.userID,
      });
      return res.data;
    } catch (err) {
      const message = err.response?.data?.message || 'Facebook login failed';
      return rejectWithValue(message);
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.error = null;
      localStorage.removeItem('auth');
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        localStorage.setItem(
          'auth',
          JSON.stringify({ user: action.payload.user, token: action.payload.token })
        );
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Registration failed';
      })
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        localStorage.setItem(
          'auth',
          JSON.stringify({ user: action.payload.user, token: action.payload.token })
        );
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Login failed';
      })
      .addCase(loginWithGoogle.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginWithGoogle.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        localStorage.setItem(
          'auth',
          JSON.stringify({ user: action.payload.user, token: action.payload.token })
        );
      })
      .addCase(loginWithGoogle.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Google login failed';
      })
      .addCase(loginWithFacebook.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginWithFacebook.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        localStorage.setItem(
          'auth',
          JSON.stringify({ user: action.payload.user, token: action.payload.token })
        );
      })
      .addCase(loginWithFacebook.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Facebook login failed';
      });
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;

