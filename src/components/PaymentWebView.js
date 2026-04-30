import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, AppState, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { AntDesign } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Loading from './smart_components/Loading';
import { APP_SCHEME } from '../../service/mobile_reservation_models';

const getQueryParam = (url, keys) => {
  const keyList = Array.isArray(keys) ? keys : [keys];

  if (!url || keyList.length === 0) {
    return null;
  }

  for (const key of keyList) {
    const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const match = url.match(new RegExp(`[?&]${escapedKey}=([^&#]+)`, 'i'));

    if (match) {
      return decodeURIComponent(match[1]);
    }
  }

  return null;
};

const getRouteParamsFromUrl = (url, fallbackExternalReference) => {
  const tokenWs = getQueryParam(url, ['token_ws', 'token', 'TBK_TOKEN']);
  const externalReference = getQueryParam(url, ['external_reference', 'externalReference'])
    || fallbackExternalReference
    || null;
  const responseCode = getQueryParam(url, ['response_code', 'responseCode']);
  const status = getQueryParam(url, ['status', 'estado'])
    || (responseCode === '0' ? 'success' : null)
    || (tokenWs ? 'success' : 'failed');

  return {
    token_ws: tokenWs,
    external_reference: externalReference,
    response_code: responseCode,
    status,
  };
};

const PaymentWebView = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const hasOpenedPayment = useRef(false);
  const hasNavigatedToResult = useRef(false);
  const appState = useRef(AppState.currentState);
  const [opening, setOpening] = useState(false);
  const { paymentUrl, external_reference: externalReference } = route.params ?? {};

  const initialUrl = useMemo(() => paymentUrl ?? '', [paymentUrl]);

  const navigateToResult = (url) => {
    if (hasNavigatedToResult.current) {
      return;
    }

    hasNavigatedToResult.current = true;
    const resultParams = getRouteParamsFromUrl(url, externalReference);
    navigation.replace('PaymentResultView', resultParams);
  };

  const verifyCurrentPayment = () => {
    const url = `${APP_SCHEME}://payment-result?external_reference=${encodeURIComponent(externalReference ?? '')}`;
    navigateToResult(url);
  };

  const handleClose = () => {
    navigation.replace('PaymentResultView', {
      external_reference: externalReference ?? null,
      status: 'cancelled',
    });
  };

  const openPaymentInBrowser = async () => {
    if (!initialUrl || opening) {
      return;
    }

    try {
      setOpening(true);
      await Linking.openURL(initialUrl);
    } catch {
      Alert.alert('No se pudo abrir el pago', 'Intenta nuevamente.');
    } finally {
      setOpening(false);
    }
  };

  useEffect(() => {
    const subscription = Linking.addEventListener('url', ({ url }) => {
      if (url?.startsWith(`${APP_SCHEME}://payment-result`)) {
        navigateToResult(url);
      }
    });

    return () => subscription.remove();
  }, [externalReference, navigation]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      const wasAway = appState.current.match(/inactive|background/);
      appState.current = nextAppState;

      if (wasAway && nextAppState === 'active' && hasOpenedPayment.current) {
        verifyCurrentPayment();
      }
    });

    return () => subscription.remove();
  }, [externalReference, navigation]);

  useEffect(() => {
    if (!initialUrl || hasOpenedPayment.current) {
      return;
    }

    hasOpenedPayment.current = true;
    openPaymentInBrowser();
  }, [initialUrl]);

  if (!initialUrl) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No hay una URL de pago disponible.</Text>
        <Pressable style={styles.secondaryButton} onPress={() => navigation.goBack()}>
          <Text style={styles.secondaryButtonText}>Volver</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={handleClose}>
          <AntDesign name="closecircle" size={28} color="#000000" />
        </Pressable>
        <Text style={styles.headerTitle}>Pago</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.content}>
        {opening ? <Loading /> : null}
        <Text style={styles.title}>Esperando resultado del pago</Text>
        <Text style={styles.message}>
          Completa la transaccion en el navegador. Cuando vuelvas desde Transbank, la app confirmara el pago y actualizara la reserva.
        </Text>
        <Pressable style={styles.primaryButton} onPress={openPaymentInBrowser} disabled={opening}>
          <Text style={styles.primaryButtonText}>{opening ? 'Abriendo...' : 'Abrir navegador'}</Text>
        </Pressable>
        <Pressable style={styles.verifyButton} onPress={verifyCurrentPayment}>
          <Text style={styles.verifyButtonText}>Ya pague, verificar</Text>
        </Pressable>
        <Pressable style={styles.secondaryButton} onPress={handleClose}>
          <Text style={styles.secondaryButtonText}>Cancelar pago</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 10,
    backgroundColor: '#f8f9fa',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#222222',
  },
  headerSpacer: {
    width: 28,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    marginTop: 18,
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    color: '#222222',
  },
  message: {
    marginTop: 14,
    fontSize: 16,
    lineHeight: 22,
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
  verifyButton: {
    marginTop: 12,
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#A168DE',
    backgroundColor: '#ffffff',
  },
  verifyButtonText: {
    color: '#6b3ba8',
    fontWeight: '700',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    backgroundColor: '#f8f9fa',
  },
  emptyText: {
    textAlign: 'center',
    color: '#444444',
    fontSize: 16,
  },
  secondaryButton: {
    marginTop: 18,
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

export default PaymentWebView;
