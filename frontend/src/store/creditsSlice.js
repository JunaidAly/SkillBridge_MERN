import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import apiClient from '../api/client';

export const fetchWallet = createAsyncThunk(
  'credits/fetchWallet',
  async (_, { rejectWithValue }) => {
    try {
      const res = await apiClient.get('/credits/wallet');
      return res.data.wallet;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load wallet');
    }
  }
);

export const fetchTransactions = createAsyncThunk(
  'credits/fetchTransactions',
  async ({ limit = 20, offset = 0 } = {}, { rejectWithValue }) => {
    try {
      const res = await apiClient.get(`/credits/transactions?limit=${limit}&offset=${offset}`);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load transactions');
    }
  }
);

export const checkBalance = createAsyncThunk(
  'credits/checkBalance',
  async (_, { rejectWithValue }) => {
    try {
      const res = await apiClient.get('/credits/check-balance');
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to check balance');
    }
  }
);

export const earnTeachingCredits = createAsyncThunk(
  'credits/earnTeaching',
  async ({ meetingId, learnerId }, { rejectWithValue }) => {
    try {
      const res = await apiClient.post('/credits/earn/teaching', { meetingId, learnerId });
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to earn credits');
    }
  }
);

export const spendLearningCredits = createAsyncThunk(
  'credits/spendLearning',
  async ({ meetingId, teacherId }, { rejectWithValue }) => {
    try {
      const res = await apiClient.post('/credits/spend/learning', { meetingId, teacherId });
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to spend credits');
    }
  }
);

const creditsSlice = createSlice({
  name: 'credits',
  initialState: {
    wallet: null,
    transactions: [],
    totalTransactions: 0,
    hasMoreTransactions: false,
    loading: false,
    error: null,
  },
  reducers: {
    clearCreditsError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch wallet
      .addCase(fetchWallet.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWallet.fulfilled, (state, action) => {
        state.loading = false;
        state.wallet = action.payload;
      })
      .addCase(fetchWallet.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch transactions
      .addCase(fetchTransactions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTransactions.fulfilled, (state, action) => {
        state.loading = false;
        state.transactions = action.payload.transactions;
        state.totalTransactions = action.payload.total;
        state.hasMoreTransactions = action.payload.hasMore;
      })
      .addCase(fetchTransactions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Earn teaching credits
      .addCase(earnTeachingCredits.fulfilled, (state, action) => {
        if (state.wallet) {
          state.wallet.balance = action.payload.newBalance;
        }
        // Add transaction to the beginning
        if (action.payload.transaction) {
          state.transactions = [action.payload.transaction, ...state.transactions];
        }
      })
      // Spend learning credits
      .addCase(spendLearningCredits.fulfilled, (state, action) => {
        if (state.wallet) {
          state.wallet.balance = action.payload.newBalance;
        }
        // Add transaction to the beginning
        if (action.payload.transaction) {
          state.transactions = [action.payload.transaction, ...state.transactions];
        }
      })
      .addCase(spendLearningCredits.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const { clearCreditsError } = creditsSlice.actions;
export default creditsSlice.reducer;
