import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { AntDesign } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LoginInput from './smart_components/LoginInput';
import Loading from './smart_components/Loading';
import { GetCurrentUserProfile, buildCheckoutCustomer } from '../../service/wp_service';
import { clearCartError, startReservationCheckout } from '../features/cart/cartReservationSlice';
import { fetchChileCommunes, fetchChileRegions } from '../../service/chile_address_service';

const PAYMENT_OPTIONS = [
  {
    id: 'transbank',
    label: 'Transbank Webpay',
  },
];

const POSTAL_HELP_URL = 'https://www.correos.cl/';

const parseAddressLine = (addressLine = '') => {
  const trimmed = `${addressLine}`.trim();

  if (!trimmed) {
    return { street: '', streetNumber: '' };
  }

  const match = trimmed.match(/^(.*?)(?:\s+(\d+[A-Za-z0-9-]*))?$/);

  return {
    street: match?.[1]?.trim() ?? trimmed,
    streetNumber: match?.[2]?.trim() ?? '',
  };
};

const SelectorModal = ({ visible, title, options, selectedValue, onClose, onSelect }) => (
  <Modal visible={visible} transparent animationType="fade">
    <View style={styles.modalBackdrop}>
      <View style={styles.modalCard}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{title}</Text>
          <Pressable onPress={onClose}>
            <AntDesign name="closecircle" size={24} color="#222222" />
          </Pressable>
        </View>
        <FlatList
          data={options}
          keyExtractor={(item) => item.code}
          renderItem={({ item }) => {
            const selected = item.name === selectedValue;

            return (
              <Pressable
                style={[styles.modalOption, selected && styles.modalOptionSelected]}
                onPress={() => {
                  onSelect(item);
                  onClose();
                }}
              >
                <Text style={[styles.modalOptionText, selected && styles.modalOptionTextSelected]}>
                  {item.name}
                </Text>
              </Pressable>
            );
          }}
        />
      </View>
    </View>
  </Modal>
);

const CheckoutFormAddress = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const cartItems = useSelector((state) => state.cart.items);
  const errorMessage = useSelector((state) => state.cart.errorMessage);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingRegions, setLoadingRegions] = useState(true);
  const [loadingCommunes, setLoadingCommunes] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('transbank');
  const [regions, setRegions] = useState([]);
  const [communes, setCommunes] = useState([]);
  const [regionModalVisible, setRegionModalVisible] = useState(false);
  const [communeModalVisible, setCommuneModalVisible] = useState(false);
  const [form, setForm] = useState({
    user_id: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    document_id: '',
    street: '',
    street_number: '',
    address_2: '',
    commune_code: '',
    commune_name: '',
    region_code: '',
    region_name: '',
    postcode: '',
    country: 'CL',
  });

  const cartItem = cartItems[0] ?? null;

  useEffect(() => {
    const loadCheckoutContext = async () => {
      try {
        setLoadingProfile(true);
        setLoadingRegions(true);
        const profile = await GetCurrentUserProfile({ includeCustomerData: false });
        console.log('[CheckoutFormAddress] user profile loaded:', {
          id: profile?.id ?? null,
          email: profile?.email ?? null,
        });

        const regionsData = await fetchChileRegions();

        const checkoutDraft = await buildCheckoutCustomer(profile);
        const parsedAddress = parseAddressLine(checkoutDraft.address_1);

        setRegions(regionsData);
        setForm((current) => ({
          ...current,
          user_id: checkoutDraft.user_id ? String(checkoutDraft.user_id) : '',
          first_name: checkoutDraft.first_name ?? '',
          last_name: checkoutDraft.last_name ?? '',
          email: checkoutDraft.email ?? '',
          phone: checkoutDraft.phone ?? '',
          document_id: checkoutDraft.document_id ?? '',
          street: parsedAddress.street,
          street_number: parsedAddress.streetNumber,
          address_2: checkoutDraft.address_2 ?? '',
          commune_name: checkoutDraft.city ?? '',
          region_name: checkoutDraft.state ?? '',
          postcode: checkoutDraft.postcode ?? '',
          country: checkoutDraft.country ?? 'CL',
        }));
      } catch (error) {
        console.log('[CheckoutFormAddress] loadCheckoutContext error:', {
          message: error?.message ?? null,
          code: error?.code ?? null,
          status: error?.response?.status ?? error?.httpStatus ?? null,
          data: error?.response?.data ?? error?.details ?? null,
        });
        Alert.alert('No se pudo cargar tu informacion', error?.message ?? 'Intenta nuevamente.');
      } finally {
        setLoadingProfile(false);
        setLoadingRegions(false);
      }
    };

    loadCheckoutContext();
  }, []);

  useEffect(() => {
    const selectedRegion = regions.find((region) => region.name === form.region_name);

    if (!selectedRegion) {
      setCommunes([]);
      return;
    }

    const loadCommunes = async () => {
      try {
        setLoadingCommunes(true);
        const communeData = await fetchChileCommunes(selectedRegion.code);
        setCommunes(communeData);
        console.log('[CheckoutFormAddress] communes loaded:', {
          regionCode: selectedRegion.code,
          regionName: selectedRegion.name,
          count: communeData.length,
        });
        setForm((current) => ({
          ...current,
          region_code: selectedRegion.code,
          commune_code: communeData.find((item) => item.name === current.commune_name)?.code ?? current.commune_code,
        }));
      } catch (error) {
        console.log('[CheckoutFormAddress] communes error:', {
          message: error?.message ?? null,
          status: error?.response?.status ?? null,
          data: error?.response?.data ?? null,
        });
        Alert.alert('No se pudieron cargar las comunas', error?.message ?? 'Intenta nuevamente.');
      } finally {
        setLoadingCommunes(false);
      }
    };

    loadCommunes();
  }, [regions, form.region_name]);

  const totalAmount = useMemo(() => {
    if (!cartItem) {
      return 0;
    }

    return Number(cartItem.productPrice ?? 0) * Math.max(cartItem.quantity ?? 1, 1);
  }, [cartItem]);

  const composedAddress = useMemo(
    () => [form.street.trim(), form.street_number.trim()].filter(Boolean).join(' ').trim(),
    [form.street, form.street_number]
  );

  const fullAddressLabel = useMemo(
    () => [composedAddress, form.address_2.trim(), form.commune_name.trim(), form.region_name.trim(), form.postcode.trim(), 'Chile']
      .filter(Boolean)
      .join(', '),
    [composedAddress, form.address_2, form.commune_name, form.region_name, form.postcode]
  );

  const handleChange = (key, value) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const handleSelectRegion = (region) => {
    setForm((current) => ({
      ...current,
      region_code: region.code,
      region_name: region.name,
      commune_code: '',
      commune_name: '',
      postcode: '',
    }));
  };

  const handleSelectCommune = (commune) => {
    setForm((current) => ({
      ...current,
      commune_code: commune.code,
      commune_name: commune.name,
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

    if (!composedAddress || !form.region_name.trim() || !form.commune_name.trim()) {
      Alert.alert('Direccion incompleta', 'Completa calle, numero, region y comuna antes de pagar.');
      return;
    }

    const checkoutPayload = {
      user_id: form.user_id ? Number(form.user_id) : undefined,
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      document_id: form.document_id.trim(),
      address_1: composedAddress,
      address_2: form.address_2.trim(),
      city: form.commune_name.trim(),
      state: form.region_name.trim(),
      postcode: form.postcode.trim(),
      country: 'CL',
    };

    console.log('[CheckoutFormAddress] payment init payload:', JSON.stringify({
      cartKey: cartItem.cartKey,
      paymentMethod,
      checkoutData: checkoutPayload,
    }, null, 2));

    try {
      setSubmitting(true);
      dispatch(clearCartError());
      const checkoutResult = await dispatch(startReservationCheckout({
        cartKey: cartItem.cartKey,
        checkoutData: checkoutPayload,
        paymentMethod,
      })).unwrap();

      console.log('[CheckoutFormAddress] payment init result:', JSON.stringify(checkoutResult, null, 2));

      navigation.navigate('PaymentWebView', {
        paymentUrl: checkoutResult.paymentUrl,
        external_reference: checkoutResult.externalReference,
      });
    } catch (error) {
      console.log('[CheckoutFormAddress] payment init error:', JSON.stringify({
        message: error?.message ?? null,
        code: error?.code ?? null,
        status: error?.httpStatus ?? null,
        details: error?.details ?? null,
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

  if (loadingProfile || loadingRegions) {
    return (
      <View style={styles.emptyContainer}>
        <Loading />
      </View>
    );
  }

  return (
    <View style={styles.safeArea}>
      <SelectorModal
        visible={regionModalVisible}
        title="Selecciona una region"
        options={regions}
        selectedValue={form.region_name}
        onClose={() => setRegionModalVisible(false)}
        onSelect={handleSelectRegion}
      />
      <SelectorModal
        visible={communeModalVisible}
        title="Selecciona una comuna"
        options={communes}
        selectedValue={form.commune_name}
        onClose={() => setCommuneModalVisible(false)}
        onSelect={handleSelectCommune}
      />

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
          <Text style={styles.sectionTitle}>Datos del usuario</Text>
          <LoginInput style={styles.input} placeholder="Nombre" value={form.first_name} onChangeText={(value) => handleChange('first_name', value)} />
          <LoginInput style={styles.input} placeholder="Apellido" value={form.last_name} onChangeText={(value) => handleChange('last_name', value)} />
          <LoginInput style={styles.input} placeholder="Correo" value={form.email} onChangeText={(value) => handleChange('email', value)} keyboardType="email-address" autoCapitalize="none" />
          <LoginInput style={styles.input} placeholder="Telefono" value={form.phone} onChangeText={(value) => handleChange('phone', value)} />
          <LoginInput style={styles.input} placeholder="RUT / Documento" value={form.document_id} onChangeText={(value) => handleChange('document_id', value)} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Direccion</Text>
          <LoginInput style={styles.input} placeholder="Calle" value={form.street} onChangeText={(value) => handleChange('street', value)} />
          <LoginInput style={styles.input} placeholder="Numero" value={form.street_number} onChangeText={(value) => handleChange('street_number', value)} keyboardType="numeric" />
          <LoginInput style={styles.input} placeholder="Departamento / Oficina" value={form.address_2} onChangeText={(value) => handleChange('address_2', value)} />

          <Pressable style={styles.selectorInput} onPress={() => setRegionModalVisible(true)}>
            <Text style={form.region_name ? styles.selectorText : styles.selectorPlaceholder}>
              {form.region_name || 'Selecciona una region'}
            </Text>
            <AntDesign name="down" size={16} color="#555555" />
          </Pressable>

          <Pressable
            style={[styles.selectorInput, !form.region_code && styles.selectorInputDisabled]}
            onPress={() => form.region_code && setCommuneModalVisible(true)}
            disabled={!form.region_code}
          >
            <Text style={form.commune_name ? styles.selectorText : styles.selectorPlaceholder}>
              {loadingCommunes ? 'Cargando comunas...' : (form.commune_name || 'Selecciona una comuna')}
            </Text>
            <AntDesign name="down" size={16} color="#555555" />
          </Pressable>

          <LoginInput style={styles.input} placeholder="Codigo postal" value={form.postcode} onChangeText={(value) => handleChange('postcode', value)} keyboardType="numeric" />

          <Pressable style={styles.postalHelpButton} onPress={() => Linking.openURL(POSTAL_HELP_URL)}>
            <Text style={styles.postalHelpText}>Consultar codigo postal en CorreosChile</Text>
          </Pressable>

          <View style={styles.addressPreview}>
            <Text style={styles.addressPreviewLabel}>Direccion final</Text>
            <Text style={styles.addressPreviewText}>{fullAddressLabel || 'Completa tu direccion para ver el formato final.'}</Text>
          </View>
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
  selectorInput: {
    height: 52,
    borderWidth: 1,
    borderColor: '#ddd6f0',
    borderRadius: 10,
    paddingHorizontal: 14,
    marginBottom: 10,
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectorInputDisabled: {
    opacity: 0.55,
  },
  selectorText: {
    color: '#222222',
  },
  selectorPlaceholder: {
    color: '#8a8a8a',
  },
  postalHelpButton: {
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  postalHelpText: {
    color: '#6b3ba8',
    fontWeight: '600',
  },
  addressPreview: {
    marginTop: 14,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#f5f0fb',
  },
  addressPreviewLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6b3ba8',
  },
  addressPreviewText: {
    marginTop: 6,
    lineHeight: 20,
    color: '#444444',
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    maxHeight: '75%',
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 18,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#222222',
  },
  modalOption: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  modalOptionSelected: {
    backgroundColor: '#f2ebfb',
  },
  modalOptionText: {
    color: '#333333',
  },
  modalOptionTextSelected: {
    color: '#6b3ba8',
    fontWeight: '700',
  },
});

export default CheckoutFormAddress;
