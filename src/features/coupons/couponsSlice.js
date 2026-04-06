import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { GetCurrentUserProfile, GetMobileCoupons } from '../../../service/wp_service';
import { getReservationErrorMessage } from '../../../service/mobile_reservation_models';

export const fetchUserCoupons = createAsyncThunk(
  'coupons/fetchUserCoupons',
  async ({ availableOnly = true } = {}, { rejectWithValue }) => {
    try {
      const profile = await GetCurrentUserProfile();
      const response = await GetMobileCoupons({
        userId: profile?.id ?? profile?.customer_id,
        email: profile?.email,
        availableOnly,
      });

      return response.coupons;
    } catch (error) {
      return rejectWithValue(getReservationErrorMessage(error));
    }
  }
);

const couponsSlice = createSlice({
  name: 'coupons',
  initialState: {
    items: [],
    loading: false,
    errorMessage: '',
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserCoupons.pending, (state) => {
        state.loading = true;
        state.errorMessage = '';
      })
      .addCase(fetchUserCoupons.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchUserCoupons.rejected, (state, action) => {
        state.loading = false;
        state.errorMessage = action.payload ?? 'No se pudieron cargar los cupones.';
      });
  },
});

export const couponsReducer = couponsSlice.reducer;
