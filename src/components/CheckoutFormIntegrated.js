import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { AntDesign } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LoginInput from './smart_components/LoginInput';
import Loading from './smart_components/Loading';
import { GetCurrentUserProfile, SaveCheckoutCustomerProfile, buildCheckoutCustomer } from '../../service/wp_service';
import { clearCartError, startReservationCheckout } from '../features/cart/cartReservationSlice';
import { fetchUserCoupons } from '../features/coupons/couponsSlice';

const CHECKOUT_PROFILE_CACHE_KEY = '@seryhacer/checkout-profile-v1';

const parseAmount = (value) => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }

  const normalizedValue = String(value ?? '').replace(/[^\d,-]/g, '').replace(',', '.');
  const parsedValue = Number(normalizedValue);

  return Number.isFinite(parsedValue) ? parsedValue : 0;
};

const PAYMENT_OPTIONS = [
  {
    id: 'transbank',
    label: 'Transbank Webpay',
  },
];

const CheckoutFormIntegrated = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const cartItems = useSelector((state) => state.cart.items);
  const errorMessage = useSelector((state) => state.cart.errorMessage);
  const coupons = useSelector((state) => state.coupons.items);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('transbank');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [form, setForm] = useState({
    user_id: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    document_id: '',
    address_1: '',
    address_2: '',
    city: '',
    state: '',
    postcode: '',
    country: 'CL',
  });

  const cartItem = cartItems[0] ?? null;

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoadingProfile(true);
        const profile = await GetCurrentUserProfile({ includeCustomerData: false });
        console.log('[CheckoutFormIntegrated] user profile loaded:', {
          id: profile?.id ?? null,
          email: profile?.email ?? null,
          first_name: profile?.first_name ?? null,
          last_name: profile?.last_name ?? null,
        });
        const checkoutDraft = await buildCheckoutCustomer(profile);
        const cachedRaw = await AsyncStorage.getItem(CHECKOUT_PROFILE_CACHE_KEY);
        const cachedDraft = cachedRaw ? JSON.parse(cachedRaw) : {};
        const mergedDraft = {
          ...checkoutDraft,
          ...Object.fromEntries(Object.entries(cachedDraft).filter(([, value]) => value !== undefined && value !== null && `${value}`.trim() !== '')),
        };

        setForm({
          user_id: mergedDraft.user_id ? String(mergedDraft.user_id) : '',
          first_name: mergedDraft.first_name ?? '',
          last_name: mergedDraft.last_name ?? '',
          email: mergedDraft.email ?? '',
          phone: mergedDraft.phone ?? '',
          document_id: mergedDraft.document_id ?? '',
          address_1: mergedDraft.address_1 ?? '',
          address_2: mergedDraft.address_2 ?? '',
          city: mergedDraft.city ?? '',
          state: mergedDraft.state ?? '',
          postcode: mergedDraft.postcode ?? '',
          country: mergedDraft.country ?? 'CL',
        });
      } catch (error) {
        console.log('[CheckoutFormIntegrated] load profile error:', {
          message: error?.message ?? null,
          status: error?.response?.status ?? error?.httpStatus ?? null,
          data: error?.response?.data ?? error?.details ?? null,
        });
        Alert.alert('No se pudo cargar tu informacion', error?.message ?? 'Intenta nuevamente.');
      } finally {
        setLoadingProfile(false);
      }
    };

    loadProfile();
    dispatch(fetchUserCoupons({ availableOnly: true }));
  }, []);

  const totalAmount = useMemo(() => {
    if (!cartItem) {
      return 0;
    }

    return Number(cartItem.productPrice ?? 0) * Math.max(cartItem.quantity ?? 1, 1);
  }, [cartItem]);

  const discountAmount = useMemo(() => {
    if (!appliedCoupon) {
      return 0;
    }

    return Math.min(parseAmount(appliedCoupon.amount), totalAmount);
  }, [appliedCoupon, totalAmount]);

  const payableAmount = Math.max(totalAmount - discountAmount, 0);

  const checkoutPayload = useMemo(() => ({
    user_id: form.user_id ? Number(form.user_id) : undefined,
    first_name: form.first_name.trim(),
    last_name: form.last_name.trim(),
    email: form.email.trim(),
    phone: form.phone.trim(),
    document_id: form.document_id.trim(),
    address_1: form.address_1.trim(),
    address_2: form.address_2.trim(),
    city: form.city.trim(),
    state: form.state.trim(),
    postcode: form.postcode.trim(),
    country: form.country.trim() || 'CL',
  }), [form]);

  const handleChange = (key, value) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const handleApplyCoupon = () => {
    const normalizedCode = couponCode.trim().toUpperCase();

    if (!normalizedCode) {
      setAppliedCoupon(null);
      return;
    }

    const coupon = coupons.find((item) => item.available && String(item.code).toUpperCase() === normalizedCode);

    if (!coupon) {
      Alert.alert('Cupón no disponible', 'Revisa el código o selecciona un cupón vigente desde tu lista.');
      return;
    }

    setAppliedCoupon(coupon);
    setCouponCode(coupon.code);
  };

  const handleSelectCoupon = (coupon) => {
    if (!coupon.available) {
      return;
    }

    setAppliedCoupon(coupon);
    setCouponCode(coupon.code);
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
  };

  const handleSubmit = async () => {
    if (!cartItem || submitting) {
      return;
    }

    if (!form.first_name.trim() || !form.last_name.trim() || !form.email.trim()) {
      Alert.alert('Datos incompletos', 'Completa nombre, apellido y correo antes de pagar.');
      return;
    }

    if (appliedCoupon && !appliedCoupon.available) {
      Alert.alert('Cupón no disponible', 'Este cupón ya fue usado o venció. Quita el cupón para continuar.');
      return;
    }

    try {
      setSubmitting(true);
      dispatch(clearCartError());
      await AsyncStorage.setItem(CHECKOUT_PROFILE_CACHE_KEY, JSON.stringify(checkoutPayload));

      SaveCheckoutCustomerProfile(checkoutPayload).catch((error) => {
        console.log('[CheckoutFormIntegrated] profile save skipped:', error?.message ?? error);
      });

      console.error('[CheckoutFormIntegrated] payment init payload:', JSON.stringify({
        cartKey: cartItem.cartKey,
        paymentMethod,
        checkoutData: checkoutPayload,
        coupon: appliedCoupon,
        discountAmount,
      }, null, 2));
      const checkoutResult = await dispatch(startReservationCheckout({
        cartKey: cartItem.cartKey,
        checkoutData: checkoutPayload,
        paymentMethod,
        coupon: appliedCoupon ? {
          code: appliedCoupon.code,
          amount: discountAmount,
        } : null,
        discountAmount,
      })).unwrap();

      console.error('[CheckoutFormIntegrated] payment init result:', JSON.stringify(checkoutResult, null, 2));
      if (checkoutResult.completed) {
        dispatch(fetchUserCoupons({ availableOnly: true }));
        Alert.alert('Reserva confirmada', 'El cupón cubrió el total de la compra.');
        navigation.navigate('OrderDetailsView', { orderId: checkoutResult.orderId });
        return;
      }

      navigation.navigate('PaymentWebView', {
        paymentUrl: checkoutResult.paymentUrl,
        external_reference: checkoutResult.externalReference,
      });
    } catch (error) {
      console.error('[CheckoutFormIntegrated] payment init error:', JSON.stringify({
        message: error?.message ?? null,
        code: error?.code ?? null,
        stage: error?.stage ?? error?.details?.stage ?? null,
        status: error?.httpStatus ?? error?.response?.status ?? null,
        details: error?.details ?? error?.response?.data ?? null,
      }, null, 2));
      Alert.alert('No se pudo iniciar el pago', error?.message ?? 'Intenta nuevamente.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!cartItem) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No hay una reserva activa para pagar.</Text>
      </View>
    );
  }

  if (loadingProfile) {
    return (
      <View style={styles.emptyContainer}>
        <Loading />
      </View>
    );
  }

  return (
    <View style={styles.safeArea}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => navigation.goBack()}>
          <AntDesign name="leftcircle" size={28} color="#000000" />
        </Pressable>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>{cartItem.productName}</Text>
          <Text style={styles.summaryText}>{cartItem.reservationsLabel.join(' | ')}</Text>
          <Text style={styles.summaryAmount}>Subtotal: ${totalAmount}</Text>
          {appliedCoupon ? <Text style={styles.discountText}>Cupón {appliedCoupon.code}: -${discountAmount}</Text> : null}
          <Text style={styles.summaryTotal}>Total a pagar: ${payableAmount}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Datos de facturacion</Text>
          <LoginInput style={styles.input} placeholder="Nombre" value={form.first_name} onChangeText={(value) => handleChange('first_name', value)} />
          <LoginInput style={styles.input} placeholder="Apellido" value={form.last_name} onChangeText={(value) => handleChange('last_name', value)} />
          <LoginInput style={styles.input} placeholder="Correo" value={form.email} onChangeText={(value) => handleChange('email', value)} keyboardType="email-address" autoCapitalize="none" />
          <LoginInput style={styles.input} placeholder="Telefono" value={form.phone} onChangeText={(value) => handleChange('phone', value)} />
          <LoginInput style={styles.input} placeholder="RUT / Documento" value={form.document_id} onChangeText={(value) => handleChange('document_id', value)} />
          <LoginInput style={styles.input} placeholder="Direccion" value={form.address_1} onChangeText={(value) => handleChange('address_1', value)} />
          <LoginInput style={styles.input} placeholder="Departamento / Oficina" value={form.address_2} onChangeText={(value) => handleChange('address_2', value)} />
          <LoginInput style={styles.input} placeholder="Ciudad" value={form.city} onChangeText={(value) => handleChange('city', value)} />
          <LoginInput style={styles.input} placeholder="Region" value={form.state} onChangeText={(value) => handleChange('state', value)} />
          <LoginInput style={styles.input} placeholder="Codigo postal" value={form.postcode} onChangeText={(value) => handleChange('postcode', value)} />
          <LoginInput style={styles.input} placeholder="Pais" value={form.country} onChangeText={(value) => handleChange('country', value)} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cupón</Text>
          <View style={styles.couponRow}>
            <LoginInput
              style={[styles.input, styles.couponInput]}
              placeholder="Código de cupón"
              value={couponCode}
              onChangeText={(value) => setCouponCode(value.toUpperCase())}
              autoCapitalize="characters"
            />
            <Pressable style={styles.applyCouponButton} onPress={handleApplyCoupon}>
              <Text style={styles.applyCouponText}>Aplicar</Text>
            </Pressable>
          </View>
          {coupons.filter((coupon) => coupon.available).slice(0, 3).map((coupon) => (
            <Pressable
              key={coupon.code}
              style={[styles.availableCoupon, appliedCoupon?.code === coupon.code && styles.availableCouponSelected]}
              onPress={() => handleSelectCoupon(coupon)}
            >
              <Text style={styles.availableCouponCode}>{coupon.code}</Text>
              <Text style={styles.availableCouponAmount}>-${coupon.amount}</Text>
            </Pressable>
          ))}
          {appliedCoupon ? (
            <View style={styles.appliedCouponBox}>
              <View style={styles.appliedCouponTextGroup}>
                <Text style={styles.appliedCouponTitle}>Cupón aplicado</Text>
                <Text style={styles.appliedCouponCode}>{appliedCoupon.code} (-${discountAmount})</Text>
              </View>
              <Pressable style={styles.removeCouponButton} onPress={handleRemoveCoupon}>
                <Text style={styles.removeCouponText}>Quitar</Text>
              </Pressable>
            </View>
          ) : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Metodo de pago</Text>
          {payableAmount <= 0 ? (
            <Text style={styles.summaryText}>El cupón cubre el total. Se confirmará la reserva sin abrir Transbank.</Text>
          ) : PAYMENT_OPTIONS.map((option) => (
            <Pressable
              key={option.id}
              style={[styles.paymentOption, paymentMethod === option.id && styles.paymentOptionSelected]}
              onPress={() => setPaymentMethod(option.id)}
            >
              <Text style={[styles.paymentOptionText, paymentMethod === option.id && styles.paymentOptionTextSelected]}>
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

        <Pressable style={[styles.payButton, submitting && styles.payButtonDisabled]} onPress={handleSubmit} disabled={submitting}>
          <Text style={styles.payButtonText}>{submitting ? 'Procesando...' : payableAmount <= 0 ? 'Finalizar reserva' : 'Pagar'}</Text>
        </Pressable>
      </ScrollView>
    </View>
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
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  summaryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 18,
    marginTop: 12,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#222222',
  },
  summaryText: {
    marginTop: 8,
    color: '#555555',
    lineHeight: 20,
  },
  summaryAmount: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: '700',
    color: '#A168DE',
  },
  discountText: {
    marginTop: 8,
    fontSize: 15,
    fontWeight: '700',
    color: '#1d7a3e',
  },
  summaryTotal: {
    marginTop: 8,
    fontSize: 19,
    fontWeight: '800',
    color: '#222222',
  },
  section: {
    marginTop: 18,
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 18,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#222222',
    marginBottom: 12,
  },
  input: {
    height: 52,
    borderWidth: 1,
    borderColor: '#ddd6f0',
    borderRadius: 10,
    paddingHorizontal: 14,
    marginBottom: 10,
    backgroundColor: '#ffffff',
  },
  couponRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  couponInput: {
    flex: 1,
    marginBottom: 0,
  },
  applyCouponButton: {
    marginLeft: 10,
    borderRadius: 10,
    backgroundColor: '#A168DE',
    paddingHorizontal: 16,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyCouponText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  availableCoupon: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#ddd6f0',
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  availableCouponSelected: {
    borderColor: '#1d7a3e',
    backgroundColor: '#eef9f1',
  },
  availableCouponCode: {
    color: '#222222',
    fontWeight: '800',
  },
  availableCouponAmount: {
    color: '#1d7a3e',
    fontWeight: '800',
  },
  appliedCouponBox: {
    marginTop: 12,
    borderRadius: 10,
    backgroundColor: '#eef9f1',
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  appliedCouponTextGroup: {
    flex: 1,
    paddingRight: 12,
  },
  appliedCouponTitle: {
    color: '#1d7a3e',
    fontSize: 12,
    fontWeight: '700',
  },
  appliedCouponCode: {
    marginTop: 3,
    color: '#222222',
    fontWeight: '800',
  },
  removeCouponButton: {
    borderRadius: 9,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#1d7a3e',
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  removeCouponText: {
    color: '#1d7a3e',
    fontWeight: '800',
  },
  paymentOption: {
    borderWidth: 1,
    borderColor: '#ddd6f0',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  paymentOptionSelected: {
    backgroundColor: '#eee6f8',
    borderColor: '#A168DE',
  },
  paymentOptionText: {
    color: '#444444',
    fontWeight: '600',
  },
  paymentOptionTextSelected: {
    color: '#6b3ba8',
  },
  errorText: {
    marginTop: 16,
    textAlign: 'center',
    color: '#b42318',
  },
  payButton: {
    marginTop: 18,
    backgroundColor: '#A168DE',
    borderRadius: 12,
    alignItems: 'center',
    paddingVertical: 16,
  },
  payButtonDisabled: {
    opacity: 0.6,
  },
  payButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 24,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666666',
    fontSize: 16,
  },
});

export default CheckoutFormIntegrated;
