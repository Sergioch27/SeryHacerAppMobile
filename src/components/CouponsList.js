import React, { useEffect } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUserCoupons } from '../features/coupons/couponsSlice';
import Loading from './smart_components/Loading';

const CouponsList = () => {
  const dispatch = useDispatch();
  const coupons = useSelector((state) => state.coupons.items);
  const loading = useSelector((state) => state.coupons.loading);
  const errorMessage = useSelector((state) => state.coupons.errorMessage);

  useEffect(() => {
    dispatch(fetchUserCoupons({ availableOnly: false }));
  }, [dispatch]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Loading />
      </View>
    );
  }

  return (
    <FlatList
      data={coupons}
      keyExtractor={(item, index) => `${item.code}-${index}`}
      contentContainerStyle={styles.listContent}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Text style={styles.code}>{item.code}</Text>
          <Text style={styles.line}>Monto: {item.amount}</Text>
          <Text style={styles.line}>Vence: {item.expiresAt || 'Sin fecha'}</Text>
          <Text style={styles.line}>Disponible: {item.available ? 'Sí' : 'No'}</Text>
          <Text style={styles.line}>Orden origen: {item.sourceOrder || '-'}</Text>
          <Text style={styles.line}>Booking ID: {item.bookingId || '-'}</Text>
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
  );
};

const styles = StyleSheet.create({
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
    borderRadius: 18,
    backgroundColor: '#ffffff',
  },
  code: {
    fontSize: 18,
    fontWeight: '700',
    color: '#222222',
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
