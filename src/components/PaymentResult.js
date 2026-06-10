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
import { fetchUserCoupons } from '../features/coupons/couponsSlice';

const PaymentResult = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const paymentResult = useSelector((state) => state.cart.paymentResult);
  const {
    token_ws: tokenWsParam,
    token,
    TBK_TOKEN: tbkToken,
    external_reference: externalReferenceParam,
    externalReference: externalReferenceAlias,
    response_code: responseCodeParam,
    responseCode,
    status: statusParam,
    estado,
  } = route.params ?? {};
  const tokenWs = tokenWsParam ?? token ?? tbkToken ?? null;
  const externalReference = externalReferenceParam ?? externalReferenceAlias ?? null;
  const responseCodeValue = responseCodeParam ?? responseCode ?? null;
  const status = statusParam ?? estado ?? (responseCodeValue === '0' ? 'success' : null);

  useEffect(() => {
    dispatch(clearPaymentResult());

    if (tokenWs || externalReference) {
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

  const isSuccess = paymentResult?.status === 'success';
  const summary = paymentResult?.summary ?? null;

  useEffect(() => {
    if (isSuccess && summary?.couponCode) {
      dispatch(fetchUserCoupons({ availableOnly: true }));
    }
  }, [dispatch, isSuccess, summary?.couponCode]);

  if (!paymentResult) {
    return (
      <View style={styles.container}>
        <Loading />
        <Text style={styles.message}>Confirmando resultado del pago...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.title, isSuccess ? styles.success : styles.error]}>
        {isSuccess ? 'Pago confirmado' : 'Pago no completado'}
      </Text>
      <Text style={styles.message}>{paymentResult.message}</Text>
      {isSuccess && summary ? (
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>{summary.productName}</Text>
          {(summary.reservationsLabel ?? []).map((label, index) => (
            <Text key={`${label}-${index}`} style={styles.summaryLine}>{label}</Text>
          ))}
          <Text style={styles.summaryLine}>Subtotal: ${summary.subtotal ?? 0}</Text>
          {summary.discount ? <Text style={styles.discountLine}>Descuento: -${summary.discount}</Text> : null}
          {summary.couponCode ? <Text style={styles.summaryLine}>Cupón: {summary.couponCode}</Text> : null}
          <Text style={styles.totalLine}>Total pagado: ${summary.total ?? 0}</Text>
        </View>
      ) : null}
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
  summaryCard: {
    alignSelf: 'stretch',
    marginTop: 20,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    padding: 16,
  },
  summaryTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#222222',
    marginBottom: 8,
  },
  summaryLine: {
    fontSize: 14,
    lineHeight: 21,
    color: '#555555',
  },
  discountLine: {
    fontSize: 14,
    lineHeight: 21,
    color: '#1d7a3e',
    fontWeight: '700',
  },
  totalLine: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: '800',
    color: '#222222',
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
