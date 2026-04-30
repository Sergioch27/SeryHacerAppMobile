import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  normalizeTransbankConfirmResponse,
  normalizeTransbankInitResponse,
  parseApiError,
} from './mobile_reservation_models';
import { appConfig } from './app_config';
import { buildCheckoutCustomer, getPaymentConfirmationCallbackUrl } from './wp_service';

const TRANSBANK_PAYMENT_SERVICE_BASE_URL = appConfig.transbankBaseUrl || 'https://pago.espacioseryhacer.com';
const TRANSBANK_BASE_URL = TRANSBANK_PAYMENT_SERVICE_BASE_URL;
const TRANSBANK_CONFIRM_BASE_URL = TRANSBANK_PAYMENT_SERVICE_BASE_URL;
const TRANSBANK_STATUS_PATH = '/estado_pago';
const TRANSBANK_USER_TOKEN_KEY = '@seryhacer/transbank-user-token';
const TRANSBANK_USER_TOKEN_EMAIL_KEY = '@seryhacer/transbank-user-token-email';

const TRANSBANK_REQUEST_TIMEOUT = 15000;

const maskSecret = (value) => {
  if (!value || typeof value !== 'string') {
    return null;
  }

  if (value.length <= 8) {
    return '***';
  }

  return `${value.slice(0, 4)}...${value.slice(-4)}`;
};

const buildAxiosErrorLog = (error, extra = {}) => {
  if (error?.details?.axios) {
    return {
      ...error.details.axios,
      ...extra,
      message: error?.message ?? error.details.axios.message ?? null,
      code: error?.code ?? error.details.axios.code ?? null,
      status: error?.httpStatus ?? error.details.axios.status ?? null,
      data: error?.details?.axios?.data ?? null,
      requestUrl: error?.details?.axios?.requestUrl ?? null,
      method: error?.details?.axios?.method ?? null,
      baseURL: error?.details?.axios?.baseURL ?? null,
      params: error?.details?.axios?.params ?? null,
      timeout: error?.details?.axios?.timeout ?? null,
    };
  }

  const errorJson = typeof error?.toJSON === 'function' ? error.toJSON() : null;

  return {
    ...extra,
    message: error?.message ?? null,
    code: error?.code ?? errorJson?.code ?? null,
    status: error?.response?.status ?? errorJson?.status ?? null,
    data: error?.response?.data ?? null,
    requestUrl: error?.config?.url ?? errorJson?.config?.url ?? null,
    method: error?.config?.method ?? errorJson?.config?.method ?? null,
    baseURL: error?.config?.baseURL ?? errorJson?.config?.baseURL ?? null,
    params: error?.config?.params ?? errorJson?.config?.params ?? null,
    timeout: error?.config?.timeout ?? errorJson?.config?.timeout ?? null,
  };
};

const buildQueryString = (params = {}) => {
  const query = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');

  return query ? `?${query}` : '';
};

const sendPaymentRequest = ({ method, path, body = {}, params = {}, headers = {}, baseUrl = TRANSBANK_BASE_URL }) => new Promise((resolve, reject) => {
  const request = new XMLHttpRequest();
  const normalizedMethod = method.toUpperCase();
  const requestBaseUrl = baseUrl || TRANSBANK_BASE_URL;
  const url = `${requestBaseUrl}${path}${buildQueryString(params)}`;

  request.open(normalizedMethod, url, true);
  request.timeout = TRANSBANK_REQUEST_TIMEOUT;
  request.setRequestHeader('Content-Type', 'application/json');
  Object.entries(headers).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      request.setRequestHeader(key, value);
    }
  });

  request.onreadystatechange = () => {
    if (request.readyState !== 4) {
      return;
    }

    const rawResponse = request.responseText ?? '';
    let parsedResponse = rawResponse;

    try {
      parsedResponse = rawResponse ? JSON.parse(rawResponse) : null;
    } catch (parseError) {
      parsedResponse = rawResponse;
    }

    if (request.status >= 200 && request.status < 300) {
      resolve({
        status: request.status,
        data: parsedResponse,
      });
      return;
    }

    reject({
      message: `Request failed with status code ${request.status || 0}`,
      response: {
        status: request.status || null,
        data: parsedResponse,
      },
      config: {
        url,
        method: normalizedMethod.toLowerCase(),
        baseURL: requestBaseUrl,
        data: body,
        params,
        headers,
        timeout: TRANSBANK_REQUEST_TIMEOUT,
      },
    });
  };

  request.ontimeout = () => {
    reject({
      message: `timeout of ${TRANSBANK_REQUEST_TIMEOUT}ms exceeded`,
      code: 'ECONNABORTED',
      response: null,
      config: {
        url,
        method: normalizedMethod.toLowerCase(),
        baseURL: requestBaseUrl,
        data: body,
        params,
        headers,
        timeout: TRANSBANK_REQUEST_TIMEOUT,
      },
    });
  };

  request.onerror = () => {
    reject({
      message: 'Network request failed',
      response: null,
      config: {
        url,
        method: normalizedMethod.toLowerCase(),
        baseURL: requestBaseUrl,
        data: body,
        params,
        headers,
        timeout: TRANSBANK_REQUEST_TIMEOUT,
      },
    });
  };

  const hasBody = body && Object.keys(body).length > 0;
  request.send(hasBody ? JSON.stringify(body) : null);
});

const buildStageError = (error, stage, fallbackMessage) => {
  if (error?.stage && error?.details?.axios) {
    return error;
  }

  const parsed = parseApiError(error, fallbackMessage);

  parsed.stage = stage;
  parsed.message = `[${stage}] ${parsed.message}`;
  parsed.details = {
    ...(parsed.details ?? {}),
    stage,
    axios: buildAxiosErrorLog(error),
  };

  return parsed;
};

const getErrorStatus = (error) => (
  error?.response?.status
  ?? error?.httpStatus
  ?? error?.details?.axios?.status
  ?? null
);

const getErrorData = (error) => (
  error?.response?.data
  ?? error?.details?.axios?.data
  ?? error?.details
  ?? null
);

const getBackendErrorCode = (error) => {
  const data = getErrorData(error);

  return data?.error ?? data?.code ?? error?.backendError ?? null;
};

const isExistingTransbankUserError = (error) => {
  const data = getErrorData(error);
  const values = [
    getBackendErrorCode(error),
    data?.message,
    data?.error_message,
    error?.message,
  ].filter(Boolean).map((value) => String(value).toLowerCase());

  return values.some((value) => value.includes('usuario ya existe'));
};

const validateInitPaymentConfig = () => {
  const missingFields = [
    ['EXPO_PUBLIC_TRANSBANK_COMMERCE_NAME', appConfig.transbankCommerceName],
    ['EXPO_PUBLIC_TRANSBANK_COMMERCE_RUT', appConfig.transbankCommerceRut],
  ].filter(([, value]) => !value).map(([name]) => name);

  if (missingFields.length > 0) {
    throw new Error(`Falta configuración de Transbank en variables de entorno: ${missingFields.join(', ')}`);
  }
};

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
    console.error('[consultTransbankUserToken] request:', {
      url: `${TRANSBANK_BASE_URL}/consultar_token`,
      method: 'GET',
      email,
    });

    const response = await sendPaymentRequest({
      method: 'GET',
      path: '/consultar_token',
      body: {
        email,
      },
      params: {
        email,
      },
    });

    console.error('[consultTransbankUserToken] response:', {
      status: response?.status ?? null,
      hasToken: Boolean(extractTransbankUserToken(response?.data)),
      data: response?.data ?? null,
    });

    return extractTransbankUserToken(response?.data);
  } catch (error) {
    console.error('[consultTransbankUserToken] error:', buildAxiosErrorLog(error, {
      email,
      stage: 'consultar_token',
    }));
    throw buildStageError(error, 'consultar_token', 'No se pudo consultar el token de Transbank.');
  }
};

const createTransbankUser = async ({ name, email }) => {
  try {
    console.error('[createTransbankUser] request:', {
      url: `${TRANSBANK_BASE_URL}/crear_usuario`,
      method: 'POST',
      email,
      name,
    });

    const response = await sendPaymentRequest({
      method: 'POST',
      path: '/crear_usuario',
      body: {
        nombre: name,
        email,
      },
    });

    console.error('[createTransbankUser] response:', {
      status: response?.status ?? null,
      hasToken: Boolean(extractTransbankUserToken(response?.data)),
      data: response?.data ?? null,
    });

    return extractTransbankUserToken(response?.data);
  } catch (error) {
    console.error('[createTransbankUser] error:', buildAxiosErrorLog(error, {
      email,
      name,
      stage: 'crear_usuario',
    }));
    throw buildStageError(error, 'crear_usuario', 'No se pudo crear el usuario de Transbank.');
  }
};

const getOrCreateTransbankUserToken = async (customerOverride = null) => {
  if (appConfig.transbankUserToken) {
    console.error('[getOrCreateTransbankUserToken] using configured x-api-token');
    return appConfig.transbankUserToken;
  }

  const customer = customerOverride ?? await buildCheckoutCustomer();
  const email = customer?.email?.trim();
  const customerName = buildCustomerName(customer);

  console.error('[getOrCreateTransbankUserToken] start:', {
    email,
    customerName,
    hasCustomerOverride: Boolean(customerOverride),
  });

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
    const status = getErrorStatus(error);
    const backendError = getBackendErrorCode(error);

    if (status && ![404, 422].includes(status) && backendError !== 'not_found') {
      throw error;
    }
  }

  let createdToken = null;

  try {
    createdToken = await createTransbankUser({
      name: customerName,
      email,
    });
  } catch (error) {
    if (!isExistingTransbankUserError(error)) {
      throw error;
    }

    console.error('[getOrCreateTransbankUserToken] user already exists, consulting token for:', email);
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
  try {
    const token = await getOrCreateTransbankUserToken(customer);

    if (!token) {
      throw new Error('No se pudo obtener el x-api-token de Transbank.');
    }

    const headers = {
      'x-api-token': token,
    };

    console.error('[getTransbankHeaders] headers:', {
      'x-api-token': token ? `${token.slice(0, 8)}...` : null,
    });

    return headers;
  } catch (error) {
    console.error('[getTransbankHeaders] token resolution error:', buildAxiosErrorLog(error, {
      stage: 'resolve_x_api_token',
    }));

    throw error;
  }
};

const initiateTransbankPayment = async ({
  externalReference,
  amount,
  chatUrl,
  customer,
  }) => {
  try {
    validateInitPaymentConfig();
    const confirmationCallbackUrl = await getPaymentConfirmationCallbackUrl();

    const payload = {
      id: externalReference,
      external_reference: externalReference,
      externalReference,
      modo: appConfig.transbankMode,
      amount,
      comercio: appConfig.transbankCommerceName,
      rut_comercio: appConfig.transbankCommerceRut,
      UrlService: confirmationCallbackUrl,
      urlService: confirmationCallbackUrl,
      url_service: confirmationCallbackUrl,
      chatUrl,
      Chaturl: chatUrl,
      ChatUrl: chatUrl,
    };

    const headers = await getTransbankHeaders(customer);
    console.error('[initiateTransbankPayment] request meta:', {
      url: `${TRANSBANK_BASE_URL}/iniciar_pago`,
      externalReference,
      amount,
      mode: appConfig.transbankMode,
      comercio: appConfig.transbankCommerceName,
      rutComercio: appConfig.transbankCommerceRut,
      urlService: confirmationCallbackUrl,
      chatUrl,
      headers: {
        'x-api-token': maskSecret(headers?.['x-api-token']),
      },
    });
    console.error('[initiateTransbankPayment] payload shape:', {
      id: payload.id,
      modo: payload.modo,
      amount: payload.amount,
      comercio: payload.comercio,
      rut_comercio: payload.rut_comercio,
      UrlService: payload.UrlService,
      urlService: payload.urlService,
      url_service: payload.url_service,
      chatUrl: payload.chatUrl,
      Chaturl: payload.Chaturl,
      ChatUrl: payload.ChatUrl,
    });

    const response = await sendPaymentRequest({
      method: 'POST',
      path: '/iniciar_pago',
      body: payload,
      headers,
    });
    console.error('[initiateTransbankPayment] response meta:', {
      status: response?.status ?? null,
      hasToken: Boolean(response?.data?.token_ws ?? response?.data?.token),
      hasPaymentUrl: Boolean(
        response?.data?.payment_url
        ?? response?.data?.url
        ?? response?.data?.redirect_url
        ?? response?.data?.redirectUrl
      ),
      data: response?.data ?? null,
    });

    return normalizeTransbankInitResponse(response.data);
  } catch (error) {
    console.error('[initiateTransbankPayment] error:', buildAxiosErrorLog(error, {
      stage: 'iniciar_pago',
      externalReference,
      amount,
    }));
    throw buildStageError(error, 'iniciar_pago', 'No se pudo iniciar el pago con Transbank.');
  }
};

const confirmTransbankPayment = async ({ tokenWs, externalReference }) => {
  try {
    const headers = await getTransbankHeaders();
    console.error('[confirmTransbankPayment] request meta:', {
      url: `${TRANSBANK_CONFIRM_BASE_URL}${TRANSBANK_STATUS_PATH}`,
      tokenWs: maskSecret(tokenWs),
      externalReference,
      headers: {
        'x-api-token': maskSecret(headers?.['x-api-token']),
      },
    });

    const params = {};

    if (tokenWs) {
      params.token_ws = tokenWs;
    }

    if (externalReference) {
      params.external_reference = externalReference;
    }

    const response = await sendPaymentRequest({
      method: 'GET',
      baseUrl: TRANSBANK_CONFIRM_BASE_URL,
      path: TRANSBANK_STATUS_PATH,
      params,
      headers,
    });
    console.error('[confirmTransbankPayment] response meta:', {
      status: response?.status ?? null,
      paymentStatus: response?.data?.status ?? response?.data?.response_code ?? null,
      externalReference: response?.data?.external_reference ?? response?.data?.data?.external_reference ?? null,
      buyOrder: response?.data?.buy_order ?? response?.data?.data?.buy_order ?? null,
      data: response?.data ?? null,
    });

    return normalizeTransbankConfirmResponse(response.data);
  } catch (error) {
    const status = getErrorStatus(error);

    if (status === 404) {
      return normalizeTransbankConfirmResponse({
        pending: true,
        status: 'PENDING',
        external_reference: externalReference,
        data: getErrorData(error),
      });
    }

    console.error('[confirmTransbankPayment] error:', buildAxiosErrorLog(error, {
      stage: 'confirmar_pago',
      tokenWs: maskSecret(tokenWs),
      externalReference,
    }));
    throw buildStageError(error, 'confirmar_pago', 'No se pudo confirmar el pago con Transbank.');
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
