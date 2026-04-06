import React, { useEffect } from 'react';
import { Alert } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import {
  expireReservationItems,
  persistCartState,
  restoreCartState,
} from '../features/cart/cartReservationSlice';

const CartSessionManager = () => {
  const dispatch = useDispatch();
  const cartState = useSelector((state) => state.cart);

  useEffect(() => {
    dispatch(restoreCartState());
  }, [dispatch]);

  useEffect(() => {
    if (!cartState.initialized) {
      return;
    }

    persistCartState(cartState).catch((error) => {
      console.error('[CartSessionManager] no se pudo persistir el carrito', error);
    });
  }, [cartState]);

  useEffect(() => {
    if (!cartState.initialized) {
      return undefined;
    }

    const intervalId = setInterval(() => {
      dispatch(expireReservationItems())
        .unwrap()
        .then((expiredKeys) => {
          if (expiredKeys.length > 0) {
            Alert.alert('Reserva expirada', 'La reserva superó los 20 minutos y fue removida del carrito.');
          }
        })
        .catch((error) => {
          if (error?.message) {
            console.error('[CartSessionManager] error expirando reservas', error.message);
          }
        });
    }, 1000);

    return () => clearInterval(intervalId);
  }, [cartState.initialized, dispatch]);

  return null;
};

export default CartSessionManager;
