import { createSlice } from '@reduxjs/toolkit';

const formatReservationDate = (reservation) => {
  const year = reservation?.año ?? reservation?.year;
  const month = reservation?.mes ?? reservation?.month;
  const day = reservation?.dia ?? reservation?.day;
  const start = reservation?.horaInicio ?? reservation?.start;
  const end = reservation?.horaFin ?? reservation?.end;

  if (!year || !month || !day || !start) {
    return '';
  }

  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')} ${start}${end ? ` - ${end}` : ''}`;
};

const groupReservations = (reservationList, bookingType, baseKey) => {
  if (bookingType === 'JORNADA 4 HORAS' && reservationList.length > 0) {
    const labels = reservationList.map(formatReservationDate).filter(Boolean);

    if (labels.length === 0) {
      return [];
    }

    return [
      {
        reservationKey: `${baseKey}-block`,
        label: `Bloque 4 horas: ${labels[0]}${labels.length > 1 ? ` | ${labels[labels.length - 1]}` : ''}`,
        data: reservationList,
        isBlock: true,
      },
    ];
  }

  return reservationList
    .map((reservation, index) => {
      const label = formatReservationDate(reservation);

      if (!label) {
        return null;
      }

      return {
        reservationKey: `${baseKey}-${index}-${Math.random().toString(36).slice(2, 6)}`,
        label,
        data: reservation,
        isBlock: false,
      };
    })
    .filter(Boolean);
};

const normalizeCartItem = ({ productItem, reservas, bookingType }) => {
  const primaryProduct = Array.isArray(productItem) && productItem.length > 0 ? productItem[0] : productItem;
  const detailProduct = primaryProduct?.parent_data ?? primaryProduct ?? {};
  const reservationList = Array.isArray(reservas) ? reservas : [];
  const cartBaseKey = `${detailProduct.id ?? primaryProduct?.id ?? 'box'}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const reservations = groupReservations(reservationList, bookingType, cartBaseKey);

  return {
    cartKey: cartBaseKey,
    productId: detailProduct.id ?? primaryProduct?.id ?? null,
    variationId: primaryProduct?.id ?? null,
    productName: detailProduct?.name ?? primaryProduct?.name ?? 'Box',
    productPrice: detailProduct?.price ?? detailProduct?.regular_price ?? primaryProduct?.price ?? primaryProduct?.regular_price ?? '',
    productImage: detailProduct?.images?.[0]?.src ?? primaryProduct?.image?.src ?? primaryProduct?.images?.[0]?.src ?? null,
    bookingType: bookingType ?? '1 HORA',
    productItem,
    reservas: reservationList,
    reservations,
    reservationsLabel: reservations.map((reservation) => reservation.label),
    quantity: reservationList.length || 1,
  };
};

const initialState = {
  items: [],
  expiresAt: null,
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addCartItem: (state, action) => {
      state.items.push(normalizeCartItem(action.payload));
      if (!state.expiresAt) {
        state.expiresAt = Date.now() + (20 * 60 * 1000);
      }
    },
    removeCartItem: (state, action) => {
      state.items = state.items.filter((item) => item.cartKey !== action.payload);
      if (state.items.length === 0) {
        state.expiresAt = null;
      }
    },
    removeCartReservation: (state, action) => {
      const { cartKey, reservationKey } = action.payload;
      const cartItem = state.items.find((item) => item.cartKey === cartKey);

      if (!cartItem) {
        return;
      }

      const reservationToRemove = cartItem.reservations.find((reservation) => reservation.reservationKey === reservationKey);

      if (!reservationToRemove) {
        return;
      }

      if (reservationToRemove.isBlock) {
        state.items = state.items.filter((item) => item.cartKey !== cartKey);
        if (state.items.length === 0) {
          state.expiresAt = null;
        }
        return;
      }

      cartItem.reservations = cartItem.reservations.filter((reservation) => reservation.reservationKey !== reservationKey);
      cartItem.reservas = cartItem.reservations.map((reservation) => reservation.data);
      cartItem.reservationsLabel = cartItem.reservations.map((reservation) => reservation.label);
      cartItem.quantity = cartItem.reservas.length || 1;

      if (cartItem.reservations.length === 0) {
        state.items = state.items.filter((item) => item.cartKey !== cartKey);
      }

      if (state.items.length === 0) {
        state.expiresAt = null;
      }
    },
    clearCart: (state) => {
      state.items = [];
      state.expiresAt = null;
    },
  },
});

export const { addCartItem, removeCartItem, removeCartReservation, clearCart } = cartSlice.actions;
export const cartReducer = cartSlice.reducer;
