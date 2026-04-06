import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  TRANSBANK_API_KEY_SECRET,
  TRANSBANK_COMMERCE_CODE,
  TRANSBANK_COMMERCE_NAME,
  TRANSBANK_COMMERCE_RUT,
  TRANSBANK_MODE,
  normalizeTransbankConfirmResponse,
  normalizeTransbankInitResponse,
  parseApiError,
} from './mobile_reservation_models';
import { buildCheckoutCustomer } from './wp_service';

const TRANSBANK_BASE_URL = 'https://pagospsicologos.duckdns.org';
const TRANSBANK_USER_TOKEN_KEY = '@seryhacer/transbank-user-token';
const TRANSBANK_USER_TOKEN_EMAIL_KEY = '@seryhacer/transbank-user-token-email';

const extractTransbankUserToken = (data = {}) => (
  data?.token
  ?? data?.user_token
  ?? data?.access_token
  ?? data?.data?.token
  ?? data?.data?.user_token
  ?? data?.usuario?.token
  ?? data?.user?.token
  ?? null
);

const buildCustomerName = (customer = {}) => {
  const fullName = [customer?.first_name, customer?.last_name].filter(Boolean).join(' ').trim();
  return fullName || customer?.name || customer?.email || 'Cliente Sery Hacer';
};

const loadCachedTransbankUserToken = async (email) => {
  if (!email) {
    return null;
  }

  const [cachedEmail, cachedToken] = await Promise.all([
    AsyncStorage.getItem(TRANSBANK_USER_TOKEN_EMAIL_KEY),
    AsyncStorage.getItem(TRANSBANK_USER_TOKEN_KEY),
  ]);

  if (cachedEmail && cachedToken && cachedEmail.toLowerCase() === email.toLowerCase()) {
    return cachedToken;
  }

  return null;
};

const persistTransbankUserToken = async (email, token) => {
  if (!email || !token) {
    return;
  }

  await Promise.all([
    AsyncStorage.setItem(TRANSBANK_USER_TOKEN_EMAIL_KEY, email),
    AsyncStorage.setItem(TRANSBANK_USER_TOKEN_KEY, token),
  ]);
};

const consultTransbankUserToken = async (email) => {
  try {
    const response = await axios({
      method: 'GET',
      url: `${TRANSBANK_BASE_URL}/consultar_token`,
      headers: {
        'Content-Type': 'application/json',
      },
      data: {
        email,
      },
    });

    console.error('[consultTransbankUserToken] response:', JSON.stringify(response?.data ?? null, null, 2));
    return extractTransbankUserToken(response?.data);
  } catch (error) {
    console.error('[consultTransbankUserToken] error:', {
      message: error?.message,
      code: error?.code,
      status: error?.response?.status ?? null,
      data: error?.response?.data ?? null,
      requestUrl: error?.config?.url ?? null,
      method: error?.config?.method ?? null,
    });
    throw error;
  }
};

const createTransbankUser = async ({ name, email }) => {
  try {
    const response = await axios.post(`${TRANSBANK_BASE_URL}/crear_usuario`, {
      nombre: name,
      email,
    });

    console.error('[createTransbankUser] response:', JSON.stringify(response?.data ?? null, null, 2));
    return extractTransbankUserToken(response?.data);
  } catch (error) {
    console.error('[createTransbankUser] error:', {
      message: error?.message,
      code: error?.code,
      status: error?.response?.status ?? null,
      data: error?.response?.data ?? null,
      requestUrl: error?.config?.url ?? null,
      method: error?.config?.method ?? null,
    });
    throw error;
  }
};

const getOrCreateTransbankUserToken = async (customerOverride = null) => {
  const customer = customerOverride ?? await buildCheckoutCustomer();
  const email = customer?.email?.trim();

  if (!email) {
    throw new Error('No se pudo obtener el correo del usuario para Transbank.');
  }

  const cachedToken = await loadCachedTransbankUserToken(email);

  if (cachedToken) {
    console.error('[getOrCreateTransbankUserToken] using cached token for:', email);
    return cachedToken;
  }

  try {
    const existingToken = await consultTransbankUserToken(email);

    if (existingToken) {
      console.error('[getOrCreateTransbankUserToken] token recovered for:', email);
      await persistTransbankUserToken(email, existingToken);
      return existingToken;
    }
  } catch (error) {
    const status = error?.response?.status;
    const backendError = error?.response?.data?.error ?? error?.response?.data?.code ?? null;

    if (status && ![404, 422].includes(status) && backendError !== 'not_found') {
      throw parseApiError(error, 'No se pudo consultar el token de Transbank.');
    }
  }

  let createdToken = null;

  try {
    createdToken = await createTransbankUser({
      name: buildCustomerName(customer),
      email,
    });
  } catch (error) {
    const backendError = error?.response?.data?.error ?? error?.response?.data?.code ?? null;

    if (backendError !== 'Usuario ya existe') {
      throw parseApiError(error, 'No se pudo crear el usuario de Transbank.');
    }
  }

  if (createdToken) {
    console.error('[getOrCreateTransbankUserToken] token created for:', email);
    await persistTransbankUserToken(email, createdToken);
    return createdToken;
  }

  const tokenAfterCreate = await consultTransbankUserToken(email);

  if (!tokenAfterCreate) {
    throw new Error('No se pudo obtener el token de Transbank para este usuario.');
  }

  await persistTransbankUserToken(email, tokenAfterCreate);
  console.error('[getOrCreateTransbankUserToken] token recovered after create for:', email);
  return tokenAfterCreate;
};

const getTransbankHeaders = async (customer = null) => {
  const token = await getOrCreateTransbankUserToken(customer);

  if (!token) {
    return {};
  }

  const headers = {
    'x-api-token': token,
  };

  console.error('[getTransbankHeaders] headers:', {
    'x-api-token': token ? `${token.slice(0, 8)}...` : null,
  });

  return headers;
};

const initiateTransbankPayment = async ({
  externalReference,
  amount,
  urlService,
  chatUrl,
  customer,
  }) => {
  try {
    const payload = {
      id: externalReference,
      modo: TRANSBANK_MODE,
      cliente: {
        commerceCode: TRANSBANK_COMMERCE_CODE,
        APIKey: TRANSBANK_API_KEY_SECRET,
      },
      amount,
      comercio: TRANSBANK_COMMERCE_NAME,
      rut_comercio: TRANSBANK_COMMERCE_RUT,
      UrlService: urlService,
      chatUrl,
    };

    console.error('[initiateTransbankPayment] payload:', JSON.stringify(payload, null, 2));

    const headers = await getTransbankHeaders(customer);
    console.error('[initiateTransbankPayment] request meta:', {
      url: `${TRANSBANK_BASE_URL}/iniciar_pago`,
      headers,
    });

    const response = await axios.post(`${TRANSBANK_BASE_URL}/iniciar_pago`, payload, {
      headers,
    });
    console.error('[initiateTransbankPayment] response:', JSON.stringify(response?.data ?? null, null, 2));

    return normalizeTransbankInitResponse(response.data);
  } catch (error) {
    console.error('[initiateTransbankPayment] error:', {
      message: error?.message,
      code: error?.code,
      status: error?.response?.status ?? null,
      data: error?.response?.data ?? null,
      requestUrl: error?.config?.url ?? null,
      method: error?.config?.method ?? null,
      headers: error?.config?.headers ?? null,
      timeout: error?.config?.timeout ?? null,
    });
    throw parseApiError(error, 'No se pudo iniciar el pago con Transbank.');
  }
};

const confirmTransbankPayment = async ({ tokenWs }) => {
  try {
    const headers = await getTransbankHeaders();
    console.error('[confirmTransbankPayment] request meta:', {
      url: `${TRANSBANK_BASE_URL}/confirmar_pago`,
      tokenWs,
      headers,
    });
    const response = await axios.get(`${TRANSBANK_BASE_URL}/confirmar_pago`, {
      params: {
        token_ws: tokenWs,
      },
      headers,
    });
    console.error('[confirmTransbankPayment] response:', JSON.stringify(response?.data ?? null, null, 2));

    return normalizeTransbankConfirmResponse(response.data);
  } catch (error) {
    console.error('[confirmTransbankPayment] error:', {
      message: error?.message,
      code: error?.code,
      status: error?.response?.status ?? null,
      data: error?.response?.data ?? null,
      requestUrl: error?.config?.url ?? null,
      method: error?.config?.method ?? null,
    });
    throw parseApiError(error, 'No se pudo confirmar el pago con Transbank.');
  }
};

export {
  TRANSBANK_BASE_URL,
  consultTransbankUserToken,
  confirmTransbankPayment,
  createTransbankUser,
  getOrCreateTransbankUserToken,
  initiateTransbankPayment,
};
