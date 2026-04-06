import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { AntDesign } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LoginInput from './smart_components/LoginInput';
import Loading from './smart_components/Loading';
import { GetCurrentUserProfile, buildCheckoutCustomer } from '../../service/wp_service';
import { clearCartError, startReservationCheckout } from '../features/cart/cartReservationSlice';

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
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('transbank');
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

        setForm({
          user_id: checkoutDraft.user_id ? String(checkoutDraft.user_id) : '',
          first_name: checkoutDraft.first_name ?? '',
          last_name: checkoutDraft.last_name ?? '',
          email: checkoutDraft.email ?? '',
          phone: checkoutDraft.phone ?? '',
          document_id: checkoutDraft.document_id ?? '',
          address_1: checkoutDraft.address_1 ?? '',
          address_2: checkoutDraft.address_2 ?? '',
          city: checkoutDraft.city ?? '',
          state: checkoutDraft.state ?? '',
          postcode: checkoutDraft.postcode ?? '',
          country: checkoutDraft.country ?? 'CL',
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
  }, []);

  const totalAmount = useMemo(() => {
    if (!cartItem) {
      return 0;
    }

    return Number(cartItem.productPrice ?? 0) * Math.max(cartItem.quantity ?? 1, 1);
  }, [cartItem]);

  const handleChange = (key, value) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const handleSubmit = async () => {
    if (!cartItem || submitting) {
      return;
    }

    if (!form.first_name.trim() || !form.last_name.trim() || !form.email.trim()) {
      Alert.alert('Datos incompletos', 'Completa nombre, apellido y correo antes de pagar.');
      return;
    }

    try {
      setSubmitting(true);
      dispatch(clearCartError());
      console.error('[CheckoutFormIntegrated] payment init payload:', JSON.stringify({
        cartKey: cartItem.cartKey,
        paymentMethod,
        checkoutData: {
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
        },
      }, null, 2));
      const checkoutResult = await dispatch(startReservationCheckout({
        cartKey: cartItem.cartKey,
        checkoutData: {
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
        },
        paymentMethod,
      })).unwrap();

      console.error('[CheckoutFormIntegrated] payment init result:', JSON.stringify(checkoutResult, null, 2));
      navigation.navigate('PaymentWebView', {
        paymentUrl: checkoutResult.paymentUrl,
        external_reference: checkoutResult.externalReference,
      });
    } catch (error) {
      console.error('[CheckoutFormIntegrated] payment init error:', JSON.stringify({
        message: error?.message ?? null,
        code: error?.code ?? null,
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
          <Text style={styles.summaryAmount}>Total: ${totalAmount}</Text>
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
          <Text style={styles.sectionTitle}>Metodo de pago</Text>
          {PAYMENT_OPTIONS.map((option) => (
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
          <Text style={styles.payButtonText}>{submitting ? 'Procesando...' : 'Pagar'}</Text>
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
