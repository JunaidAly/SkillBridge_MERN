import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import apiClient from '../api/client';
import { logout } from './authSlice';

const initialState = {
  profile: null,
  loading: false,
  error: null,
  updateLoading: false,
  updateError: null,
};

// Fetch current user profile
export const fetchProfile = createAsyncThunk(
  'profile/fetch',
  async (_, { rejectWithValue }) => {
    try {
      const res = await apiClient.get('/users/me');
      return res.data.user;
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to fetch profile';
      return rejectWithValue(message);
    }
  }
);

// Update profile
export const updateProfile = createAsyncThunk(
  'profile/update',
  async (profileData, { rejectWithValue }) => {
    try {
      const res = await apiClient.put('/users/me', profileData);
      return res.data.user;
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to update profile';
      return rejectWithValue(message);
    }
  }
);

// Upload avatar
export const uploadAvatar = createAsyncThunk(
  'profile/uploadAvatar',
  async (file, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      const res = await apiClient.post('/users/me/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data.avatar;
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to upload avatar';
      return rejectWithValue(message);
    }
  }
);

// Delete avatar
export const deleteAvatar = createAsyncThunk(
  'profile/deleteAvatar',
  async (_, { rejectWithValue }) => {
    try {
      await apiClient.delete('/users/me/avatar');
      return null;
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to delete avatar';
      return rejectWithValue(message);
    }
  }
);

// Add skill to teach
export const addTeachingSkill = createAsyncThunk(
  'profile/addTeachingSkill',
  async (name, { rejectWithValue }) => {
    try {
      const res = await apiClient.post('/users/me/skills/teaching', { name });
      return res.data.skillsTeaching;
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to add skill';
      return rejectWithValue(message);
    }
  }
);

// Remove skill to teach
export const removeTeachingSkill = createAsyncThunk(
  'profile/removeTeachingSkill',
  async (skillId, { rejectWithValue }) => {
    try {
      const res = await apiClient.delete(`/users/me/skills/teaching/${skillId}`);
      return res.data.skillsTeaching;
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to remove skill';
      return rejectWithValue(message);
    }
  }
);

// Add skill to learn
export const addLearningSkill = createAsyncThunk(
  'profile/addLearningSkill',
  async (name, { rejectWithValue }) => {
    try {
      const res = await apiClient.post('/users/me/skills/learning', { name });
      return res.data.skillsLearning;
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to add learning goal';
      return rejectWithValue(message);
    }
  }
);

// Remove skill to learn
export const removeLearningSkill = createAsyncThunk(
  'profile/removeLearningSkill',
  async (skillName, { rejectWithValue }) => {
    try {
      const res = await apiClient.delete(`/users/me/skills/learning/${encodeURIComponent(skillName)}`);
      return res.data.skillsLearning;
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to remove learning goal';
      return rejectWithValue(message);
    }
  }
);

// Add certification
export const addCertification = createAsyncThunk(
  'profile/addCertification',
  async ({ name, issuer, year, file }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('name', name);
      if (issuer) formData.append('issuer', issuer);
      if (year) formData.append('year', year);
      if (file) formData.append('file', file);

      const res = await apiClient.post('/users/me/certifications', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data.certifications;
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to add certification';
      return rejectWithValue(message);
    }
  }
);

// Remove certification
export const removeCertification = createAsyncThunk(
  'profile/removeCertification',
  async (certId, { rejectWithValue }) => {
    try {
      const res = await apiClient.delete(`/users/me/certifications/${certId}`);
      return res.data.certifications;
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to remove certification';
      return rejectWithValue(message);
    }
  }
);

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {
    clearProfileError: (state) => {
      state.error = null;
      state.updateError = null;
    },
    clearProfile: (state) => {
      state.profile = null;
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch profile
      .addCase(fetchProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload;
      })
      .addCase(fetchProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update profile
      .addCase(updateProfile.pending, (state) => {
        state.updateLoading = true;
        state.updateError = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.updateLoading = false;
        state.profile = action.payload;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.updateLoading = false;
        state.updateError = action.payload;
      })
      // Upload avatar
      .addCase(uploadAvatar.pending, (state) => {
        state.updateLoading = true;
        state.updateError = null;
      })
      .addCase(uploadAvatar.fulfilled, (state, action) => {
        state.updateLoading = false;
        if (state.profile) {
          state.profile.avatar = action.payload;
        }
      })
      .addCase(uploadAvatar.rejected, (state, action) => {
        state.updateLoading = false;
        state.updateError = action.payload;
      })
      // Delete avatar
      .addCase(deleteAvatar.fulfilled, (state) => {
        if (state.profile) {
          state.profile.avatar = '';
        }
      })
      // Add teaching skill
      .addCase(addTeachingSkill.fulfilled, (state, action) => {
        if (state.profile) {
          state.profile.skillsTeaching = action.payload;
        }
      })
      // Remove teaching skill
      .addCase(removeTeachingSkill.fulfilled, (state, action) => {
        if (state.profile) {
          state.profile.skillsTeaching = action.payload;
        }
      })
      // Add learning skill
      .addCase(addLearningSkill.fulfilled, (state, action) => {
        if (state.profile) {
          state.profile.skillsLearning = action.payload;
        }
      })
      // Remove learning skill
      .addCase(removeLearningSkill.fulfilled, (state, action) => {
        if (state.profile) {
          state.profile.skillsLearning = action.payload;
        }
      })
      // Add certification
      .addCase(addCertification.pending, (state) => {
        state.updateLoading = true;
        state.updateError = null;
      })
      .addCase(addCertification.fulfilled, (state, action) => {
        state.updateLoading = false;
        if (state.profile) {
          state.profile.certifications = action.payload;
        }
      })
      .addCase(addCertification.rejected, (state, action) => {
        state.updateLoading = false;
        state.updateError = action.payload;
      })
      // Remove certification
      .addCase(removeCertification.fulfilled, (state, action) => {
        if (state.profile) {
          state.profile.certifications = action.payload;
        }
      })
      // Clear profile on logout
      .addCase(logout, (state) => {
        state.profile = null;
        state.loading = false;
        state.error = null;
        state.updateLoading = false;
        state.updateError = null;
      });
  },
});

export const { clearProfileError, clearProfile } = profileSlice.actions;
export default profileSlice.reducer;
