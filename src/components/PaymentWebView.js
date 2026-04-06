import React, { useMemo, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { AntDesign } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import Loading from './smart_components/Loading';
import { APP_SCHEME } from '../../service/mobile_reservation_models';

const getQueryParam = (url, key) => {
  if (!url || !key) {
    return null;
  }

  const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = url.match(new RegExp(`[?&]${escapedKey}=([^&#]+)`));
  return match ? decodeURIComponent(match[1]) : null;
};

const getRouteParamsFromUrl = (url, fallbackExternalReference) => {
  const tokenWs = getQueryParam(url, 'token_ws');
  const externalReference = getQueryParam(url, 'external_reference') || fallbackExternalReference || null;
  const status = getQueryParam(url, 'status') || (tokenWs ? 'success' : 'failed');

  return {
    token_ws: tokenWs,
    external_reference: externalReference,
    status,
  };
};

const PaymentWebView = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const webViewRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [currentUrl, setCurrentUrl] = useState('');
  const { paymentUrl, external_reference: externalReference } = route.params ?? {};

  const initialUrl = useMemo(() => paymentUrl ?? '', [paymentUrl]);

  const navigateToResult = (url) => {
    const resultParams = getRouteParamsFromUrl(url, externalReference);
    navigation.replace('PaymentResultView', resultParams);
  };

  const handleClose = () => {
    navigation.replace('PaymentResultView', {
      external_reference: externalReference ?? null,
      status: 'cancelled',
    });
  };

  const handleNavigationRequest = (request) => {
    const url = request?.url ?? '';

    if (!url) {
      return true;
    }

    if (url.startsWith(`${APP_SCHEME}://payment-result`)) {
      navigateToResult(url);
      return false;
    }

    return true;
  };

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

      <View style={styles.addressBar}>
        <Text style={styles.addressText} numberOfLines={1}>
          {currentUrl || initialUrl}
        </Text>
      </View>

      <WebView
        ref={webViewRef}
        source={{ uri: initialUrl }}
        startInLoadingState
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <Loading />
            <Text style={styles.loadingText}>Cargando pasarela de pago...</Text>
          </View>
        )}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        onShouldStartLoadWithRequest={handleNavigationRequest}
        onNavigationStateChange={(navState) => {
          setCurrentUrl(navState.url);

          if (navState.url?.startsWith(`${APP_SCHEME}://payment-result`)) {
            navigateToResult(navState.url);
          }
        }}
        onError={() => {
          Alert.alert('No se pudo abrir el pago', 'Intenta nuevamente.');
          handleClose();
        }}
      />

      {loading ? (
        <View style={styles.loadingBadge}>
          <Loading />
          <Text style={styles.loadingBadgeText}>Preparando pago...</Text>
        </View>
      ) : null}
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
  addressBar: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#f0f2f5',
    borderBottomWidth: 1,
    borderBottomColor: '#d9dde3',
  },
  addressText: {
    color: '#5a6472',
    fontSize: 12,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  loadingText: {
    marginTop: 12,
    color: '#555555',
  },
  loadingBadge: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(17, 24, 39, 0.9)',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  loadingBadgeText: {
    marginLeft: 10,
    color: '#ffffff',
    fontWeight: '600',
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
