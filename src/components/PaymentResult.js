import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation, useRoute } from '@react-navigation/native';
import Loading from './smart_components/Loading';
import {
  clearPaymentResult,
  confirmReservationPaymentFromReturn,
  setPaymentFailure,
} from '../features/cart/cartReservationSlice';

const PaymentResult = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const paymentResult = useSelector((state) => state.cart.paymentResult);
  const { token_ws: tokenWs, external_reference: externalReference, status } = route.params ?? {};

  useEffect(() => {
    dispatch(clearPaymentResult());

    if (tokenWs) {
      dispatch(confirmReservationPaymentFromReturn({
        tokenWs,
        externalReference,
      }));
      return;
    }

    if (status && status !== 'success') {
      dispatch(setPaymentFailure({
        message: 'El pago fue cancelado o rechazado.',
        externalReference,
      }));
    }
  }, [dispatch, externalReference, status, tokenWs]);

  if (!paymentResult) {
    return (
      <View style={styles.container}>
        <Loading />
        <Text style={styles.message}>Confirmando resultado del pago...</Text>
      </View>
    );
  }

  const isSuccess = paymentResult.status === 'success';

  return (
    <View style={styles.container}>
      <Text style={[styles.title, isSuccess ? styles.success : styles.error]}>
        {isSuccess ? 'Pago confirmado' : 'Pago no completado'}
      </Text>
      <Text style={styles.message}>{paymentResult.message}</Text>
      <Pressable
        style={styles.primaryButton}
        onPress={() => navigation.navigate('ShopTab', { screen: isSuccess ? 'OrderView' : 'ProductView' })}
      >
        <Text style={styles.primaryButtonText}>{isSuccess ? 'Ver mis reservas' : 'Volver al catálogo'}</Text>
      </Pressable>
      {!isSuccess ? (
        <Pressable style={styles.secondaryButton} onPress={() => navigation.navigate('CartView')}>
          <Text style={styles.secondaryButtonText}>Reintentar pago</Text>
        </Pressable>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    backgroundColor: '#f8f9fa',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
  },
  success: {
    color: '#1d7a3e',
  },
  error: {
    color: '#b42318',
  },
  message: {
    marginTop: 14,
    fontSize: 16,
    textAlign: 'center',
    color: '#555555',
  },
  primaryButton: {
    marginTop: 28,
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#A168DE',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  secondaryButton: {
    marginTop: 12,
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#eee6f8',
  },
  secondaryButtonText: {
    color: '#6b3ba8',
    fontWeight: '700',
  },
});

export default PaymentResult;
