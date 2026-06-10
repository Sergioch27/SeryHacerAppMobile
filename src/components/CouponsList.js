import React, { useEffect } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUserCoupons } from '../features/coupons/couponsSlice';
import Loading from './smart_components/Loading';
import Header from './smart_components/Header';

const CouponsList = () => {
  const dispatch = useDispatch();
  const coupons = useSelector((state) => state.coupons.items);
  const loading = useSelector((state) => state.coupons.loading);
  const errorMessage = useSelector((state) => state.coupons.errorMessage);

  useEffect(() => {
    dispatch(fetchUserCoupons({ availableOnly: false }));
  }, [dispatch]);

  const handleCopyCoupon = (code) => {
    const Clipboard = require('react-native').Clipboard;

    if (Clipboard?.setString) {
      Clipboard.setString(code);
      Alert.alert('Cupón copiado', code);
      return;
    }

    Alert.alert('Código de cupón', code);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Loading />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header />
      <FlatList
        data={coupons}
        keyExtractor={(item, index) => `${item.code}-${index}`}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={[styles.card, !item.available && styles.cardUnavailable]}>
            <View style={styles.cardHeader}>
              <View style={styles.codeGroup}>
                <Text style={styles.code}>{item.code}</Text>
                <Text style={[styles.badge, item.available ? styles.available : styles.unavailable]}>
                  {item.available ? 'Disponible' : 'Usado o vencido'}
                </Text>
              </View>
              <Pressable style={styles.copyButton} onPress={() => handleCopyCoupon(item.code)}>
                <Text style={styles.copyText}>Copiar</Text>
              </Pressable>
            </View>
            <Text style={[styles.amount, !item.available && styles.amountUnavailable]}>${item.amount}</Text>
            <Text style={styles.line}>Vence: {item.expiresAt || 'Sin fecha'}</Text>
            {item.usageLimit ? <Text style={styles.line}>Uso: {item.usageCount}/{item.usageLimit}</Text> : null}
            {item.sourceOrder ? <Text style={styles.line}>Generado por orden #{item.sourceOrder}</Text> : null}
          </View>
        )}
        ListEmptyComponent={(
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>{errorMessage || 'No hay cupones para mostrar.'}</Text>
            {errorMessage ? (
              <Pressable style={styles.retryButton} onPress={() => dispatch(fetchUserCoupons({ availableOnly: false }))}>
                <Text style={styles.retryText}>Reintentar</Text>
              </Pressable>
            ) : null}
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 20,
    paddingBottom: 40,
  },
  card: {
    marginBottom: 16,
    padding: 18,
    borderRadius: 12,
    backgroundColor: '#ffffff',
  },
  cardUnavailable: {
    opacity: 0.72,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  codeGroup: {
    flex: 1,
    paddingRight: 12,
  },
  code: {
    fontSize: 22,
    fontWeight: '800',
    color: '#222222',
    letterSpacing: 0,
  },
  badge: {
    alignSelf: 'flex-start',
    marginTop: 8,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    fontSize: 12,
    fontWeight: '700',
  },
  available: {
    color: '#1d7a3e',
    backgroundColor: '#eaf7ee',
  },
  unavailable: {
    color: '#8a4b00',
    backgroundColor: '#fff4df',
  },
  copyButton: {
    borderRadius: 10,
    backgroundColor: '#A168DE',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  copyText: {
    color: '#ffffff',
    fontWeight: '800',
  },
  amount: {
    marginTop: 14,
    fontSize: 20,
    fontWeight: '800',
    color: '#1d7a3e',
  },
  amountUnavailable: {
    color: '#777777',
  },
  line: {
    marginTop: 6,
    fontSize: 14,
    color: '#555555',
  },
  emptyContainer: {
    paddingTop: 40,
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
    color: '#666666',
    fontSize: 16,
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#A168DE',
  },
  retryText: {
    color: '#ffffff',
    fontWeight: '700',
  },
});

export default CouponsList;
