import { View, FlatList, StyleSheet, Text, Pressable } from 'react-native';
import React, { useState, useEffect, useCallback } from 'react';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { GetOder } from '../../service/wp_service';
import Loading from './smart_components/Loading';
import Header from './smart_components/Header';

const formatOrderDate = (dateString) => {
  if (!dateString) {
    return '';
  }

  return new Date(dateString).toLocaleDateString('es-CL', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const formatCurrency = (value) => {
  const amount = Number(value ?? 0);
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(amount);
};

const statusMap = {
  pending: 'Pendiente',
  processing: 'En proceso',
  completed: 'Completada',
  cancelled: 'Cancelada',
  failed: 'Fallida',
  'on-hold': 'En espera',
  refunded: 'Reembolsada',
};

const OrderListEnhanced = () => {
  const [orderData, setOrderData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [page, setPage] = useState(1);
  const navigation = useNavigation();

  const loadOrders = async (nextPage = 1, options = {}) => {
    const { reset = false, isRefresh = false } = options;

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else if (nextPage === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      setErrorMessage('');
      const data = await GetOder(nextPage);
      setPage(nextPage);
      setOrderData((prev) => (reset || nextPage === 1 ? data : [...prev, ...data]));
      console.log('[OrderList] ordenes:', data);
    } catch (err) {
      console.error('Error al listar ordenes', err);
      setErrorMessage('No se pudieron cargar las órdenes. Intenta nuevamente.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadOrders(1, { reset: true });
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadOrders(1, { reset: true });
    }, [])
  );

  const loadMoreOrders = () => {
    if (!loading && !loadingMore && orderData.length > 0) {
      loadOrders(page + 1);
    }
  };

  const OrderCard = ({ item }) => {
    const itemsCount = item.line_items?.length ?? 0;
    const paymentMethod = item.payment_method_title || 'Sin método informado';
    const customerName = `${item.billing?.first_name ?? ''} ${item.billing?.last_name ?? ''}`.trim() || 'Cliente';

    return (
      <View style={styles.cardContent}>
        <View style={styles.cardTopRow}>
          <View>
            <Text style={styles.orderLabel}>Orden #{item.id}</Text>
            <Text style={styles.orderDate}>{formatOrderDate(item.date_created)}</Text>
          </View>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>{statusMap[item.status] ?? item.status}</Text>
          </View>
        </View>
        <Text style={styles.customerName}>{customerName}</Text>
        <Text style={styles.summaryText}>{itemsCount} producto(s)</Text>
        <Text style={styles.summaryText}>{paymentMethod}</Text>
        <View style={styles.cardBottomRow}>
          <Text style={styles.totalText}>{formatCurrency(item.total)}</Text>
          <Text style={styles.linkText}>Ver detalle</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Header />
      <View style={styles.contentList}>
        <Pressable style={styles.couponsButton} onPress={() => navigation.navigate('CouponsView')}>
          <Text style={styles.couponsButtonText}>Ver cupones</Text>
        </Pressable>
        {loading ? (
          <View style={styles.loading}>
            <Loading />
          </View>
        ) : (
          <FlatList
            data={orderData}
            renderItem={({ item }) => (
              <Pressable onPress={() => navigation.navigate('OrderDetailsView', { orderId: item.id })}>
                <OrderCard item={item} />
              </Pressable>
            )}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContent}
            onRefresh={() => loadOrders(1, { reset: true, isRefresh: true })}
            refreshing={refreshing}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>{errorMessage || 'No hay órdenes para mostrar.'}</Text>
                {errorMessage ? (
                  <Pressable style={styles.retryButton} onPress={() => loadOrders(1, { reset: true, isRefresh: true })}>
                    <Text style={styles.retryButtonText}>Reintentar</Text>
                  </Pressable>
                ) : null}
              </View>
            }
            ListFooterComponent={loadingMore ? <View style={styles.load}><Loading /></View> : null}
            onEndReached={loadMoreOrders}
            onEndReachedThreshold={0.2}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loading: {
    marginTop: 200,
  },
  contentList: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  couponsButton: {
    marginHorizontal: 20,
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#eee6f8',
    alignItems: 'center',
  },
  couponsButtonText: {
    color: '#6b3ba8',
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  cardContent: {
    marginTop: 16,
    padding: 18,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  orderLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#222222',
  },
  orderDate: {
    marginTop: 4,
    fontSize: 13,
    color: '#666666',
  },
  statusBadge: {
    backgroundColor: '#eee6f8',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  statusText: {
    color: '#6b3ba8',
    fontSize: 12,
    fontWeight: '700',
  },
  customerName: {
    marginTop: 14,
    fontSize: 16,
    fontWeight: '600',
    color: '#222222',
  },
  summaryText: {
    marginTop: 6,
    fontSize: 14,
    color: '#666666',
  },
  cardBottomRow: {
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#A168DE',
  },
  linkText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#A168DE',
  },
  emptyContainer: {
    marginTop: 40,
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666666',
    fontSize: 16,
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: '#A168DE',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  retryButtonText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  load: {
    marginTop: 20,
  },
});

export default OrderListEnhanced;
