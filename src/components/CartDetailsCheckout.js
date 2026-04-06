import React, { useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, Image, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { AntDesign } from '@expo/vector-icons';
import { clearCartError, removeReservationFromCart } from '../features/cart/cartReservationSlice';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ModalLoginOut } from './smart_components/Modals';
import { parseServerDateTime } from '../../service/mobile_reservation_models';

const CartDetailsCheckout = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const cartItems = useSelector((state) => state.cart.items);
  const errorMessage = useSelector((state) => state.cart.errorMessage);
  const [remainingMs, setRemainingMs] = useState(0);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [confirmModalTitle, setConfirmModalTitle] = useState('');
  const [pendingAction, setPendingAction] = useState(null);

  const totalReservations = useMemo(
    () => cartItems.reduce((acc, item) => acc + (item.quantity ?? item.reservas?.length ?? 0), 0),
    [cartItems]
  );

  useEffect(() => {
    if (cartItems.length === 0) {
      setRemainingMs(0);
      return undefined;
    }

    const updateRemaining = () => {
      const nextExpiration = cartItems.reduce((closest, item) => {
        const expirationDate = parseServerDateTime(item?.expirationDate);
        const expiration = expirationDate ? expirationDate.getTime() : null;

        if (!expiration || !['in_cart', 'pending'].includes(item.reservationState)) {
          return closest;
        }

        if (!closest || expiration < closest) {
          return expiration;
        }

        return closest;
      }, null);

      if (nextExpiration) {
        console.log('[CartDetailsCheckout] countdown target:', {
          nextExpirationIso: new Date(nextExpiration).toISOString(),
          remainingMinutes: Math.floor(Math.max(nextExpiration - Date.now(), 0) / 60000),
        });
      }

      setRemainingMs(nextExpiration ? Math.max(nextExpiration - Date.now(), 0) : 0);
    };

    updateRemaining();
    const intervalId = setInterval(updateRemaining, 1000);
    return () => clearInterval(intervalId);
  }, [cartItems]);

  const countdownLabel = useMemo(() => {
    const totalSeconds = Math.floor(remainingMs / 1000);
    const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
    const seconds = String(totalSeconds % 60).padStart(2, '0');
    return `${minutes}:${seconds}`;
  }, [remainingMs]);

  const closeConfirmModal = () => {
    setConfirmModalVisible(false);
    setPendingAction(null);
  };

  const openConfirmModal = (title, action) => {
    setConfirmModalTitle(title);
    setPendingAction(() => action);
    setConfirmModalVisible(true);
  };

  const handleConfirmAction = () => {
    if (pendingAction) {
      pendingAction();
    }
    closeConfirmModal();
  };

  const handleRemoveItem = (item) => {
    openConfirmModal(
      `¿Estás seguro de eliminar "${item.productName}" del carrito?`,
      () => {
        dispatch(clearCartError());
        dispatch(removeReservationFromCart({ cartKey: item.cartKey }))
          .unwrap()
          .catch((error) => {
            Alert.alert('No se pudo eliminar', error?.message ?? 'Intenta nuevamente.');
          });
      }
    );
  };

  const handleContinueShopping = () => {
    navigation.navigate('ShopTab', { screen: 'ProductView' });
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      Alert.alert('Carrito vacío', 'Debes agregar al menos una reserva.');
      return;
    }

    dispatch(clearCartError());
    navigation.navigate('CheckoutView');
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderText}>
          <Text style={styles.productName}>{item.productName}</Text>
          {item.productPrice ? <Text style={styles.productPrice}>${item.productPrice}</Text> : null}
        </View>
        <Pressable onPress={() => handleRemoveItem(item)}>
          <AntDesign name="delete" size={22} color="#A168DE" />
        </Pressable>
      </View>
      {item.productImage ? <Image source={{ uri: item.productImage }} style={styles.productImage} /> : null}
      <Text style={styles.sectionTitle}>Horas seleccionadas</Text>
      {item.reservations.map((reservation) => (
        <View key={reservation.reservationKey} style={styles.reservationRow}>
          <Text style={styles.reservationText}>{reservation.label}</Text>
          <Pressable onPress={() => handleRemoveItem(item)}>
            <AntDesign name="closecircle" size={20} color="#A168DE" />
          </Pressable>
        </View>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => navigation.goBack()}>
          <AntDesign name="leftcircle" size={28} color="#000000" />
        </Pressable>
        <Text style={styles.headerTitle}>Carrito</Text>
        <View style={styles.headerSpacer} />
      </View>

      <FlatList
        data={cartItems}
        keyExtractor={(item) => item.cartKey}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={cartItems.length > 0 ? (
          <View style={styles.timerCard}>
            <Text style={styles.timerTitle}>Tiempo para cerrar la compra</Text>
            <Text style={styles.timerValue}>{countdownLabel}</Text>
            {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
          </View>
        ) : null}
        ListEmptyComponent={<Text style={styles.emptyText}>No hay reservas agregadas.</Text>}
      />

      <View style={styles.footer}>
        <View>
          <Text style={styles.summaryTitle}>Reservas</Text>
          <Text style={styles.summaryText}>{totalReservations} hora(s) seleccionada(s)</Text>
        </View>
        <View style={styles.footerButtons}>
          <Pressable style={styles.secondaryButton} onPress={handleContinueShopping}>
            <Text style={styles.secondaryButtonText}>Agregar otro box</Text>
          </Pressable>
          <Pressable style={styles.primaryButton} onPress={handleCheckout}>
            <Text style={styles.primaryButtonText}>Finalizar compra</Text>
          </Pressable>
        </View>
      </View>
      <ModalLoginOut
        isVisible={confirmModalVisible}
        onClose={closeConfirmModal}
        textTitle={confirmModalTitle}
        textButton1={'ELIMINAR'}
        textButton2={'CANCELAR'}
        onLoginOut={handleConfirmAction}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#222222',
  },
  headerSpacer: {
    width: 28,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 180,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
  },
  timerCard: {
    marginTop: 16,
    backgroundColor: '#fff4e8',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  timerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8a5a1f',
  },
  timerValue: {
    marginTop: 6,
    fontSize: 28,
    fontWeight: '700',
    color: '#d97706',
  },
  errorText: {
    marginTop: 8,
    color: '#b42318',
    textAlign: 'center',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardHeaderText: {
    flex: 1,
    paddingRight: 12,
  },
  productName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#222222',
  },
  productPrice: {
    marginTop: 4,
    fontSize: 16,
    fontWeight: '600',
    color: '#A168DE',
  },
  productImage: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    marginTop: 14,
  },
  sectionTitle: {
    marginTop: 14,
    marginBottom: 8,
    fontSize: 15,
    fontWeight: '700',
    color: '#222222',
  },
  reservationText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: '#555555',
    paddingRight: 12,
  },
  reservationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  emptyText: {
    marginTop: 40,
    textAlign: 'center',
    color: '#666666',
    fontSize: 16,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    padding: 20,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#222222',
  },
  summaryText: {
    marginTop: 4,
    fontSize: 14,
    color: '#666666',
  },
  footerButtons: {
    marginTop: 14,
  },
  secondaryButton: {
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#eee6f8',
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#6b3ba8',
    fontWeight: '700',
  },
  primaryButton: {
    marginTop: 10,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#A168DE',
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontWeight: '700',
  },
});

export default CartDetailsCheckout;
