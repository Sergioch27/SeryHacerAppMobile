import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { Platform } from 'react-native';
import {
  BuildChatUrl,
  ConfirmMobileReservationPayment,
  ExpireMobileReservation,
  GetCurrentUserProfile,
  InitMobileReservationPayment,
  LockMobileReservationCart,
  RemoveMobileReservationCart,
} from '../../../service/wp_service';
import { confirmTransbankPayment, initiateTransbankPayment } from '../../../service/transbank_service';
import {
  DEFAULT_EXPIRATION_MINUTES,
  RESERVATION_STORAGE_KEY,
  buildExistingExternalReference,
  buildReservationLabels,
  formatReservationStart,
  getDetailProduct,
  getProductBookingConfig,
  getReservationAmount,
  getReservationErrorMessage,
  getVariationForBookingType,
  isReservationExpireConflict,
  isLocalStateResetError,
  parseServerDateTime,
  resolveReservationExpirationDate,
} from '../../../service/mobile_reservation_models';

const getCartBaseKey = (productId) => `${productId ?? 'box'}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const APP_VERSION = '1.0.0';
const PAYMENT_STATUS_POLL_ATTEMPTS = 12;
const PAYMENT_STATUS_POLL_INTERVAL_MS = 2500;

const buildReservations = (reservationList = [], bookingType, baseKey) => {
  const labels = buildReservationLabels(reservationList, bookingType);

  if (bookingType === 'JORNADA 4 HORAS' && labels.length > 0) {
    return [
      {
        reservationKey: `${baseKey}-block`,
        label: labels[0],
        data: reservationList,
        isBlock: true,
      },
    ];
  }

  return reservationList.map((reservation, index) => ({
    reservationKey: `${baseKey}-${index}-${Math.random().toString(36).slice(2, 6)}`,
    label: labels[index],
    data: reservation,
    isBlock: false,
  })).filter((reservation) => reservation.label);
};

const buildCartItem = ({
  productItem,
  reservas,
  bookingType,
  bookingResponse,
}) => {
  const detailProduct = getDetailProduct(productItem);
  const selectedVariation = getVariationForBookingType(productItem, bookingType);
  const reservationList = Array.isArray(reservas) ? reservas : [];
  const cartKey = getCartBaseKey(detailProduct?.id);
  const reservations = buildReservations(reservationList, bookingType, cartKey);
  const bookingConfig = getProductBookingConfig(productItem, bookingType);
  const start = formatReservationStart(reservationList[0]);
  const effectiveExpirationDate = resolveReservationExpirationDate(bookingResponse.expirationDate);

  console.log('[buildCartItem] expiration resolution:', {
    bookingId: bookingResponse.bookingId,
    serverExpirationDate: bookingResponse.expirationDate ?? null,
    effectiveExpirationDate,
  });

  return {
    cartKey,
    productId: detailProduct?.id ?? null,
    variationId: selectedVariation?.id ?? null,
    productName: detailProduct?.name ?? 'Box',
    productPrice: detailProduct?.price ?? detailProduct?.regular_price ?? '',
    productImage: detailProduct?.images?.[0]?.src ?? null,
    bookingType: bookingType ?? '1 HORA',
    productItem,
    reservas: reservationList,
    reservations,
    reservationsLabel: reservations.map((reservation) => reservation.label),
    quantity: reservationList.length || 1,
    activityId: bookingConfig.activityId,
    formId: bookingConfig.formId,
    start,
    bookingId: bookingResponse.bookingId,
    expirationDate: effectiveExpirationDate,
    reservationState: bookingResponse.status ?? 'in_cart',
    paymentStatus: 'owed',
    orderId: null,
    externalReference: null,
    lastError: '',
    uiStatus: 'idle',
    existing: Boolean(bookingResponse.existing),
    paymentUrl: null,
    tokenWs: null,
  };
};

const findItemIndex = (state, cartKey) => state.items.findIndex((item) => item.cartKey === cartKey);
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const pollTransbankPaymentStatus = async ({ tokenWs, externalReference }) => {
  let lastResponse = null;

  for (let attempt = 0; attempt < PAYMENT_STATUS_POLL_ATTEMPTS; attempt += 1) {
    lastResponse = await confirmTransbankPayment({ tokenWs, externalReference });

    if (lastResponse.successful) {
      return lastResponse;
    }

    if (!lastResponse.pending) {
      return lastResponse;
    }

    if (attempt < PAYMENT_STATUS_POLL_ATTEMPTS - 1) {
      await wait(PAYMENT_STATUS_POLL_INTERVAL_MS);
    }
  }

  return lastResponse;
};

const buildPaymentPayload = (item) => {
  const amount = getReservationAmount(item.productPrice, item.quantity);

  return {
    product: {
      product_id: item.productId,
      variation_id: item.variationId,
    },
    payment: {
      currency: 'CLP',
      amount,
      subtotal: amount,
      method: 'transbank',
      method_title: 'Transbank Webpay',
    },
    meta: {
      app_platform: Platform.OS,
      app_version: APP_VERSION,
    },
  };
};

export const restoreCartState = createAsyncThunk('cart/restoreCartState', async () => {
  const raw = await AsyncStorage.getItem(RESERVATION_STORAGE_KEY);

  if (!raw) {
    return {
      items: [],
      paymentResult: null,
      bookingMap: {},
    };
  }

  const parsed = JSON.parse(raw);

  return {
    items: Array.isArray(parsed?.items) ? parsed.items : [],
    paymentResult: parsed?.paymentResult ?? null,
    bookingMap: parsed?.bookingMap ?? {},
  };
});

export const addReservationToCart = createAsyncThunk(
  'cart/addReservationToCart',
  async ({ productItem, reservas, bookingType }, { rejectWithValue }) => {
    try {
      const profile = await GetCurrentUserProfile();
      const bookingConfig = getProductBookingConfig(productItem, bookingType);
      const reservationList = Array.isArray(reservas) ? reservas : [];
      const start = formatReservationStart(reservationList[0]);

      if (!bookingConfig.activityId || !bookingConfig.formId || !start) {
        throw new Error('El producto no tiene configuración de reserva válida.');
      }

      const cartLockPayload = {
        booking: {
          activity_id: bookingConfig.activityId,
          form_id: bookingConfig.formId,
          start,
          quantity: reservationList.length || 1,
          expiration_minutes: DEFAULT_EXPIRATION_MINUTES,
        },
        customer: {
          user_id: profile?.id ?? profile?.customer_id,
          email: profile?.email,
        },
      };

      console.log('[addReservationToCart] cart lock payload:', JSON.stringify(cartLockPayload, null, 2));

      const bookingResponse = await LockMobileReservationCart(cartLockPayload);

      return buildCartItem({
        productItem,
        reservas,
        bookingType,
        bookingResponse,
      });
    } catch (error) {
      return rejectWithValue({
        message: getReservationErrorMessage(error),
        code: error?.code ?? null,
      });
    }
  }
);

export const removeReservationFromCart = createAsyncThunk(
  'cart/removeReservationFromCart',
  async ({ cartKey }, { getState, rejectWithValue }) => {
    const item = getState().cart.items.find((entry) => entry.cartKey === cartKey);

    if (!item) {
      return { cartKey, missing: true };
    }

    try {
      await RemoveMobileReservationCart({
        bookingId: item.bookingId,
        externalReference: item.externalReference,
      });

      return { cartKey };
    } catch (error) {
      if (isLocalStateResetError(error)) {
        return { cartKey, reset: true };
      }

      return rejectWithValue({
        cartKey,
        message: getReservationErrorMessage(error),
      });
    }
  }
);

export const expireReservationItems = createAsyncThunk(
  'cart/expireReservationItems',
  async (_, { getState, rejectWithValue }) => {
    const now = Date.now();
    const expiredItems = getState().cart.items.filter((item) => {
      const expirationDate = parseServerDateTime(item?.expirationDate);
      const expiration = expirationDate ? expirationDate.getTime() : null;
      return expiration && expiration <= now && ['in_cart', 'pending'].includes(item.reservationState);
    });

    if (expiredItems.length === 0) {
      return [];
    }

    try {
      const results = await Promise.allSettled(
        expiredItems.map((item) => ExpireMobileReservation({ bookingId: item.bookingId }))
      );

      const removableKeys = [];

      results.forEach((result, index) => {
        const item = expiredItems[index];

        if (result.status === 'fulfilled') {
          removableKeys.push(item.cartKey);
          return;
        }

        const error = result.reason;

        if (isReservationExpireConflict(error) || isLocalStateResetError(error)) {
          console.error('[expireReservationItems] treating backend terminal state as expired:', {
            bookingId: item.bookingId,
            cartKey: item.cartKey,
            status: error?.httpStatus ?? error?.response?.status ?? null,
            code: error?.code ?? null,
            message: error?.message ?? null,
          });
          removableKeys.push(item.cartKey);
        }
      });

      if (removableKeys.length > 0) {
        return removableKeys;
      }

      throw results.find((result) => result.status === 'rejected')?.reason;
    } catch (error) {
      return rejectWithValue({
        message: getReservationErrorMessage(error),
      });
    }
  }
);

export const startReservationCheckout = createAsyncThunk(
  'cart/startReservationCheckout',
  async ({ cartKey, checkoutData, paymentMethod = 'transbank' }, { getState, rejectWithValue }) => {
    const item = getState().cart.items.find((entry) => entry.cartKey === cartKey);

    if (!item) {
      return rejectWithValue({ message: 'La reserva ya no está disponible en el carrito.' });
    }

    try {
      const externalReference = item.externalReference || buildExistingExternalReference();
      const paymentPayload = buildPaymentPayload(item);
      console.error('[startReservationCheckout] begin:', JSON.stringify({
        cartKey,
        bookingId: item.bookingId,
        productId: item.productId,
        variationId: item.variationId,
        amount: paymentPayload?.payment?.amount ?? null,
        externalReference,
        checkoutData,
        paymentMethod,
      }, null, 2));
      const initResponse = await InitMobileReservationPayment({
        externalReference,
        bookingId: item.bookingId,
        customer: checkoutData,
        ...paymentPayload,
        payment: {
          ...paymentPayload.payment,
          method: paymentMethod,
          method_title: paymentMethod === 'transbank' ? 'Transbank Webpay' : paymentMethod,
        },
      });
      console.error('[startReservationCheckout] wp init response:', JSON.stringify(initResponse, null, 2));
      const chatUrl = BuildChatUrl(initResponse.externalReference ?? externalReference);
      console.error('[startReservationCheckout] transbank request meta:', JSON.stringify({
        chatUrl,
        externalReference: initResponse.externalReference ?? externalReference,
      }, null, 2));
      const transbankResponse = await initiateTransbankPayment({
        externalReference: initResponse.externalReference ?? externalReference,
        amount: getReservationAmount(item.productPrice, item.quantity),
        chatUrl,
        customer: checkoutData,
      });
      console.error('[startReservationCheckout] transbank response:', JSON.stringify(transbankResponse, null, 2));

      if (!transbankResponse.paymentUrl) {
        throw new Error('Transbank no devolvió una URL de pago.');
      }

      return {
        cartKey,
        orderId: initResponse.orderId,
        externalReference: initResponse.externalReference ?? externalReference,
        bookingState: initResponse.bookingState,
        paymentUrl: transbankResponse.paymentUrl,
        tokenWs: transbankResponse.tokenWs,
      };
    } catch (error) {
      console.error('[startReservationCheckout] error:', JSON.stringify({
        message: error?.message ?? null,
        code: error?.code ?? null,
        stage: error?.stage ?? error?.details?.stage ?? null,
        status: error?.httpStatus ?? error?.response?.status ?? null,
        details: error?.details ?? error?.response?.data ?? null,
      }, null, 2));
      return rejectWithValue({
        cartKey,
        message: getReservationErrorMessage(error),
        code: error?.code ?? null,
        stage: error?.stage ?? error?.details?.stage ?? null,
        details: error?.details ?? error?.response?.data ?? null,
      });
    }
  }
);

export const confirmReservationPaymentFromReturn = createAsyncThunk(
  'cart/confirmReservationPaymentFromReturn',
  async ({ tokenWs, externalReference }, { getState, rejectWithValue }) => {
    try {
      const item = getState().cart.items.find((entry) => entry.externalReference === externalReference)
        ?? getState().cart.items.find((entry) => entry.reservationState === 'pending');
      const resolvedTokenWs = tokenWs ?? item?.tokenWs ?? null;

      if (!item) {
        throw new Error('No se encontró la reserva pendiente asociada al pago.');
      }

      if (!resolvedTokenWs && !externalReference) {
        throw new Error('No se recibio informacion suficiente para confirmar el pago.');
      }

      const transbankResponse = await pollTransbankPaymentStatus({
        tokenWs: resolvedTokenWs,
        externalReference: externalReference ?? item.externalReference,
      });

      if (!transbankResponse.successful) {
        throw new Error(transbankResponse.pending
          ? 'El pago aun no tiene resultado confirmado. Intenta verificar nuevamente en unos segundos.'
          : 'El pago fue rechazado por Transbank.');
      }

      const confirmResponse = await ConfirmMobileReservationPayment({
        orderId: item.orderId,
        bookingId: item.bookingId,
        externalReference: item.externalReference,
        payment: {
          status: 'paid',
          amount: transbankResponse.amount || getReservationAmount(item.productPrice, item.quantity),
          subtotal: transbankResponse.amount || getReservationAmount(item.productPrice, item.quantity),
          method: 'transbank',
          method_title: 'Transbank Webpay',
          transaction_id: transbankResponse.transactionId,
          paid_at: transbankResponse.paidAt,
        },
      });

      return {
        cartKey: item.cartKey,
        orderId: confirmResponse.orderId ?? item.orderId,
        bookingId: confirmResponse.bookingId ?? item.bookingId,
        externalReference: item.externalReference,
        transactionId: transbankResponse.transactionId,
      };
    } catch (error) {
      return rejectWithValue({
        message: getReservationErrorMessage(error),
        code: error?.code ?? null,
        externalReference,
      });
    }
  }
);

const initialState = {
  initialized: false,
  items: [],
  paymentResult: null,
  bookingMap: {},
  errorMessage: '',
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    clearCartError: (state) => {
      state.errorMessage = '';
    },
    clearPaymentResult: (state) => {
      state.paymentResult = null;
    },
    setPaymentFailure: (state, action) => {
      state.paymentResult = {
        status: 'failed',
        message: action.payload?.message ?? 'El pago no fue completado.',
        externalReference: action.payload?.externalReference ?? null,
      };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(restoreCartState.fulfilled, (state, action) => {
        state.initialized = true;
        state.items = action.payload.items;
        state.paymentResult = action.payload.paymentResult;
        state.bookingMap = action.payload.bookingMap;
      })
      .addCase(addReservationToCart.pending, (state) => {
        state.errorMessage = '';
      })
      .addCase(addReservationToCart.fulfilled, (state, action) => {
        state.items = [action.payload];
      })
      .addCase(addReservationToCart.rejected, (state, action) => {
        state.errorMessage = action.payload?.message ?? 'No se pudo bloquear la reserva.';
      })
      .addCase(removeReservationFromCart.fulfilled, (state, action) => {
        state.items = state.items.filter((item) => item.cartKey !== action.payload.cartKey);
      })
      .addCase(removeReservationFromCart.rejected, (state, action) => {
        state.errorMessage = action.payload?.message ?? 'No se pudo eliminar la reserva del carrito.';
      })
      .addCase(expireReservationItems.fulfilled, (state, action) => {
        if (action.payload.length > 0) {
          state.items = state.items.filter((item) => !action.payload.includes(item.cartKey));
          state.paymentResult = {
            status: 'expired',
            message: 'La reserva expiró por superar los 20 minutos sin pago.',
          };
        }
      })
      .addCase(startReservationCheckout.pending, (state, action) => {
        const index = findItemIndex(state, action.meta.arg.cartKey);

        if (index >= 0) {
          state.items[index].uiStatus = 'paying';
          state.items[index].lastError = '';
        }
      })
      .addCase(startReservationCheckout.fulfilled, (state, action) => {
        const index = findItemIndex(state, action.payload.cartKey);

        if (index >= 0) {
          state.items[index].uiStatus = 'idle';
          state.items[index].orderId = action.payload.orderId;
          state.items[index].externalReference = action.payload.externalReference;
          state.items[index].reservationState = action.payload.bookingState ?? 'pending';
          state.items[index].paymentUrl = action.payload.paymentUrl;
          state.items[index].tokenWs = action.payload.tokenWs;
        }
      })
      .addCase(startReservationCheckout.rejected, (state, action) => {
        const cartKey = action.payload?.cartKey ?? action.meta.arg.cartKey;
        const index = findItemIndex(state, cartKey);

        if (['booking_not_found', 'order_not_found'].includes(action.payload?.code)) {
          state.items = state.items.filter((item) => item.cartKey !== cartKey);
        }

        if (index >= 0 && state.items[index]) {
          state.items[index].uiStatus = 'idle';
          state.items[index].lastError = action.payload?.message ?? 'No se pudo iniciar el pago.';
        }

        state.errorMessage = action.payload?.message ?? 'No se pudo iniciar el pago.';
      })
      .addCase(confirmReservationPaymentFromReturn.fulfilled, (state, action) => {
        const index = findItemIndex(state, action.payload.cartKey);

        if (index >= 0) {
          state.bookingMap[action.payload.orderId] = action.payload.bookingId;
          state.paymentResult = {
            status: 'success',
            message: `Pago confirmado para la orden #${action.payload.orderId}.`,
            orderId: action.payload.orderId,
            bookingId: action.payload.bookingId,
            externalReference: action.payload.externalReference,
            transactionId: action.payload.transactionId,
          };
          state.items.splice(index, 1);
        }
      })
      .addCase(confirmReservationPaymentFromReturn.rejected, (state, action) => {
        if (['booking_not_found', 'order_not_found'].includes(action.payload?.code)) {
          state.items = state.items.filter((item) => item.externalReference !== action.payload?.externalReference);
        }

        state.paymentResult = {
          status: 'failed',
          message: action.payload?.message ?? 'El pago no fue confirmado.',
          externalReference: action.payload?.externalReference ?? null,
        };
      });
  },
});

export const persistCartState = async (state) => {
  await AsyncStorage.setItem(RESERVATION_STORAGE_KEY, JSON.stringify({
    items: state.items,
    paymentResult: state.paymentResult,
    bookingMap: state.bookingMap,
  }));
};

export const { clearCartError, clearPaymentResult, setPaymentFailure } = cartSlice.actions;
export const cartReducer = cartSlice.reducer;
