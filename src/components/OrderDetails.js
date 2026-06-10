import React, { useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { AntDesign } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { CancelMobileReservationOrder, GetOrderById } from '../../service/wp_service';
import { fetchUserCoupons } from '../features/coupons/couponsSlice';
import Loading from './smart_components/Loading';
import { extractBookingIdFromOrder, getReservationErrorMessage } from '../../service/mobile_reservation_models';

const formatCurrency = (value) => {
  const amount = Number(value ?? 0);
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatDateTime = (value) => {
  if (!value) {
    return '';
  }

  return new Date(value).toLocaleString('es-CL', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
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

const hiddenMetaKeys = [
  'bookacti_bookings',
  'bookacti_booking',
  '_booking_id',
  'booking_id',
  'app_booking_id',
  'reservation_booking_id',
];

const pad = (value) => String(value).padStart(2, '0');

const normalizeMetaValue = (value) => {
  if (typeof value !== 'string') {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

const formatTime = (value) => {
  if (!value) {
    return '';
  }

  return String(value).slice(0, 5);
};

const formatReservationValue = (value) => {
  const normalizedValue = normalizeMetaValue(value);
  const reservations = Array.isArray(normalizedValue) ? normalizedValue : [normalizedValue];

  return reservations.map((reservation) => {
    if (!reservation || typeof reservation !== 'object') {
      return String(reservation ?? '');
    }

    const year = reservation.año ?? reservation.year;
    const month = reservation.mes ?? reservation.month;
    const day = reservation.dia ?? reservation.day;
    const start = reservation.horaInicio ?? reservation.start;
    const end = reservation.horaFin ?? reservation.end;

    if (!year || !month || !day || !start) {
      return '';
    }

    return `${pad(day)}/${pad(month)}/${year}, ${formatTime(start)} a ${formatTime(end)}`;
  }).filter(Boolean);
};

const shouldShowMeta = (meta) => {
  const key = String(meta?.key ?? '').toLowerCase();

  if (!key || hiddenMetaKeys.includes(key) || key.startsWith('_')) {
    return false;
  }

  return key !== 'reservas_app';
};

const getItemReservations = (item) => (
  (item?.meta_data ?? [])
    .filter((meta) => meta.key === 'reservas_app')
    .flatMap((meta) => formatReservationValue(meta.value))
);

const DetailSection = ({ title, children }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {children}
  </View>
);

const OrderDetails = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const { orderId } = route.params;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);
  const bookingMap = useSelector((state) => state.cart.bookingMap);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        setErrorMessage('');
        const data = await GetOrderById(orderId);
        setOrder(data);
      } catch (error) {
        console.error('Error obteniendo detalle de orden', error);
        setErrorMessage(error?.message ?? 'No se pudo cargar la orden.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  const reservationsSummary = useMemo(() => {
    const itemMetaReservations = order?.line_items?.flatMap((item) =>
      (item.meta_data ?? []).filter((meta) => meta.key === 'reservas_app')
    ) ?? [];

    return itemMetaReservations.flatMap((meta) => formatReservationValue(meta.value));
  }, [order]);

  const bookingId = useMemo(() => extractBookingIdFromOrder(order, bookingMap), [order, bookingMap]);

  const handleCancelReservation = async () => {
    if (!bookingId || cancelLoading) {
      Alert.alert('No disponible', 'No se encontró el booking_id asociado a esta orden.');
      return;
    }

    try {
      setCancelLoading(true);
      const response = await CancelMobileReservationOrder({
        orderId: order.id,
        bookingId,
        reason: 'Cancelacion solicitada desde app mobile',
      });
      await dispatch(fetchUserCoupons({ availableOnly: false })).unwrap();
      Alert.alert(
        'Reserva cancelada',
        response?.coupon
          ? `Cupón: ${response.coupon.code}\nMonto: ${response.coupon.amount}\nVence: ${response.coupon.expires_at}`
          : 'La reserva fue cancelada correctamente.'
      );
      const refreshedOrder = await GetOrderById(orderId);
      setOrder(refreshedOrder);
    } catch (error) {
      Alert.alert('No se pudo cancelar', getReservationErrorMessage(error));
    } finally {
      setCancelLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loading}>
          <Loading />
        </View>
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loading}>
          <Text style={styles.emptyText}>{errorMessage || 'No se pudo cargar la orden.'}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        data={order.line_items ?? []}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
              <Pressable onPress={() => navigation.goBack()}>
                <AntDesign name="leftcircle" size={28} color="#000000" />
              </Pressable>
              <Text style={styles.headerTitle}>Orden #{order.id}</Text>
              <View style={styles.headerSpacer} />
            </View>

            <View style={styles.heroCard}>
              <Text style={styles.heroStatus}>{statusMap[order.status] ?? order.status}</Text>
              <Text style={styles.heroTotal}>{formatCurrency(order.total)}</Text>
              <Text style={styles.heroDate}>{formatDateTime(order.date_created)}</Text>
            </View>

            <DetailSection title="Pago">
              <Text style={styles.infoText}>Método: {order.payment_method_title || 'Sin informar'}</Text>
              <Text style={styles.infoText}>Estado pago: {order.date_paid ? 'Pagado' : 'Pendiente'}</Text>
              {order.transaction_id ? <Text style={styles.infoText}>Transacción: {order.transaction_id}</Text> : null}
            </DetailSection>

            <DetailSection title="Cliente">
              <Text style={styles.infoText}>{`${order.billing?.first_name ?? ''} ${order.billing?.last_name ?? ''}`.trim()}</Text>
              {order.billing?.email ? <Text style={styles.infoText}>{order.billing.email}</Text> : null}
              {order.billing?.phone ? <Text style={styles.infoText}>{order.billing.phone}</Text> : null}
            </DetailSection>

            <DetailSection title="Resumen de reservas">
              {reservationsSummary.length > 0 ? reservationsSummary.map((reservation, index) => (
                <Text key={`${reservation}-${index}`} style={styles.infoText}>
                  {reservation}
                </Text>
              )) : <Text style={styles.infoText}>Sin detalle adicional de reservas.</Text>}
            </DetailSection>

            <DetailSection title="Productos">
              <Text style={styles.subtleText}>Detalle de los items de la orden</Text>
            </DetailSection>
          </>
        }
        renderItem={({ item }) => (
          <View style={styles.productCard}>
            <Text style={styles.productName}>{item.name}</Text>
            {getItemReservations(item).length > 0 ? (
              <View style={styles.reservationBox}>
                <Text style={styles.reservationTitle}>Horario reservado</Text>
                {getItemReservations(item).map((reservation, index) => (
                  <Text key={`${item.id}-reservation-${index}`} style={styles.reservationText}>{reservation}</Text>
                ))}
              </View>
            ) : null}
            <Text style={styles.infoText}>Cantidad: {item.quantity}</Text>
            {item.sku ? <Text style={styles.infoText}>SKU: {item.sku}</Text> : null}
            {item.product_id ? <Text style={styles.infoText}>Producto ID: {item.product_id}</Text> : null}
            {item.variation_id ? <Text style={styles.infoText}>Variación ID: {item.variation_id}</Text> : null}
            <Text style={styles.infoText}>Subtotal: {formatCurrency(item.subtotal)}</Text>
            <Text style={styles.infoText}>Total: {formatCurrency(item.total)}</Text>
            {(item.meta_data ?? []).filter(shouldShowMeta).map((meta) => (
              <Text key={`${item.id}-${meta.id}-${meta.key}`} style={styles.metaText}>
                {meta.key}: {Array.isArray(meta.value) ? meta.value.join(' | ') : String(meta.value)}
              </Text>
            ))}
          </View>
        )}
        ListFooterComponent={
          <>
            <DetailSection title="Totales">
              <Text style={styles.infoText}>Subtotal: {formatCurrency(order.discount_total ? Number(order.total) + Number(order.discount_total) : order.total)}</Text>
              <Text style={styles.infoText}>Descuento: {formatCurrency(order.discount_total)}</Text>
              <Text style={styles.infoText}>Total: {formatCurrency(order.total)}</Text>
            </DetailSection>
            {['processing', 'completed'].includes(order.status) ? (
              <Pressable style={styles.cancelButton} onPress={handleCancelReservation} disabled={cancelLoading}>
                <Text style={styles.cancelButtonText}>{cancelLoading ? 'Cancelando...' : 'Cancelar reserva y generar cupón'}</Text>
              </Pressable>
            ) : null}
          </>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666666',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#222222',
  },
  headerSpacer: {
    width: 28,
  },
  heroCard: {
    backgroundColor: '#A168DE',
    borderRadius: 24,
    padding: 22,
  },
  heroStatus: {
    color: '#f3eaff',
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  heroTotal: {
    marginTop: 10,
    color: '#ffffff',
    fontSize: 30,
    fontWeight: '800',
  },
  heroDate: {
    marginTop: 8,
    color: '#f3eaff',
    fontSize: 14,
  },
  section: {
    marginTop: 18,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 18,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#222222',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 21,
    color: '#555555',
    marginBottom: 6,
  },
  subtleText: {
    fontSize: 13,
    color: '#777777',
  },
  productCard: {
    marginTop: 14,
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
  },
  productName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#222222',
    marginBottom: 8,
  },
  reservationBox: {
    borderRadius: 12,
    backgroundColor: '#f4effb',
    padding: 12,
    marginBottom: 12,
  },
  reservationTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#6b3ba8',
    marginBottom: 5,
  },
  reservationText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#222222',
    fontWeight: '700',
  },
  metaText: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 20,
    color: '#666666',
  },
  cancelButton: {
    marginTop: 18,
    marginBottom: 30,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#A168DE',
  },
  cancelButtonText: {
    color: '#ffffff',
    fontWeight: '700',
  },
});

export default OrderDetails;
