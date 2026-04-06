const RESERVATION_STORAGE_KEY = '@seryhacer/reservation-cart-v1';
const APP_SCHEME = 'seryhacerapp';
const PAYMENT_RESULT_PATH = 'payment-result';
const TRANSBANK_COMMERCE_CODE = '597055555532';
const TRANSBANK_API_KEY_SECRET = '579B532A7440BB0C9079DED94D31EA1615BACEB56610332264630D42D0A36B1C';
const TRANSBANK_MODE = 'INTEGRACION';
const TRANSBANK_COMMERCE_NAME = 'Servicios de psicología Ser y Hacer Ltda';
const TRANSBANK_COMMERCE_RUT = '77225631-0';
const DEFAULT_EXPIRATION_MINUTES = 20;
const BOOKING_ACTIVITY_ID = 3;

const API_ERROR_MESSAGES = {
  no_availability: 'Ya no hay cupo disponible para este horario.',
  booking_not_found: 'La reserva ya no existe. Se limpiará el estado local.',
  order_not_found: 'La orden ya no existe. Se limpiará el estado local.',
  unauthorized: 'Tu sesión no es válida. Inicia sesión nuevamente.',
};

class ApiError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = 'ApiError';
    this.httpStatus = options.httpStatus ?? null;
    this.code = options.code ?? null;
    this.backendError = options.backendError ?? null;
    this.details = options.details ?? null;
    this.originalError = options.originalError ?? null;
  }
}

const toNumber = (value, fallback = null) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toArray = (value) => (Array.isArray(value) ? value : []);

const getMetaValue = (product, keys = []) => {
  const metaData = Array.isArray(product?.meta_data) ? product.meta_data : [];

  for (const key of keys) {
    const metaItem = metaData.find((item) => item?.key === key);

    if (metaItem?.value !== undefined && metaItem?.value !== null && `${metaItem.value}`.trim() !== '') {
      return metaItem.value;
    }
  }

  return null;
};

const pad = (value) => String(value).padStart(2, '0');

const parseServerDateTime = (value) => {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === 'number') {
    const parsedDate = new Date(value);
    return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
  }

  if (typeof value !== 'string') {
    return null;
  }

  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
  }

  const match = trimmedValue.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?$/);

  if (match) {
    const [, year, month, day, hour, minute, second = '00'] = match;
    return new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute),
      Number(second),
      0
    );
  }

  const parsedDate = new Date(trimmedValue);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
};

const formatReservationDate = (reservation) => {
  const year = reservation?.año ?? reservation?.year;
  const month = reservation?.mes ?? reservation?.month;
  const day = reservation?.dia ?? reservation?.day;
  const start = reservation?.horaInicio ?? reservation?.start;
  const end = reservation?.horaFin ?? reservation?.end;

  if (!year || !month || !day || !start) {
    return '';
  }

  return `${year}-${pad(month)}-${pad(day)} ${start}${end ? ` - ${end}` : ''}`;
};

const formatReservationStart = (reservation) => {
  const year = reservation?.año ?? reservation?.year;
  const month = reservation?.mes ?? reservation?.month;
  const day = reservation?.dia ?? reservation?.day;
  const start = reservation?.horaInicio ?? reservation?.start;

  if (!year || !month || !day || !start) {
    return null;
  }

  return `${year}-${pad(month)}-${pad(day)} ${start}`;
};

const getPrimaryProduct = (productItem) => {
  if (Array.isArray(productItem) && productItem.length > 0) {
    return productItem[0];
  }

  return productItem ?? null;
};

const getDetailProduct = (productItem) => {
  const primaryProduct = getPrimaryProduct(productItem);
  return primaryProduct?.parent_data ?? primaryProduct ?? {};
};

const getVariationForBookingType = (productItem, bookingType) => {
  const variations = toArray(productItem);

  if (!bookingType || variations.length === 0) {
    return getPrimaryProduct(productItem);
  }

  return variations.find((variation) =>
    toArray(variation?.attributes).some((attribute) => {
      const values = [attribute?.option, ...(Array.isArray(attribute?.options) ? attribute.options : [])]
        .filter(Boolean);

      if (attribute?.name === 'TIPO DE RESERVA' && values.includes(bookingType)) {
        return true;
      }

      return attribute?.name === 'TIPO DE RESERVA' && attribute?.value === bookingType;
    })
  ) ?? getPrimaryProduct(productItem);
};

const getTopLevelValue = (product, keys = []) => {
  for (const key of keys) {
    if (product?.[key] !== undefined && product?.[key] !== null && `${product[key]}`.trim() !== '') {
      return product[key];
    }
  }

  return null;
};

const getProductBookingConfig = (productItem, bookingType) => {
  const primaryProduct = getVariationForBookingType(productItem, bookingType);
  const detailProduct = getDetailProduct(productItem);
  const sources = [primaryProduct, detailProduct].filter(Boolean);
  const formIdKeys = [
    'bookacti_variable_form',
    'bookacti_form_id',
    'bookacti_form',
    '_bookacti_variable_form',
  ];

  let formId = null;

  for (const source of sources) {
    if (!formId) {
      formId = getMetaValue(source, formIdKeys) ?? getTopLevelValue(source, formIdKeys);
    }
  }

  console.log('[getProductBookingConfig] bookingType:', bookingType, {
    primaryProductId: primaryProduct?.id ?? null,
    parentProductId: detailProduct?.id ?? null,
    topLevelFormId: primaryProduct?.bookacti_form_id ?? null,
    metaFormId: getMetaValue(primaryProduct, formIdKeys),
    resolvedFormId: formId,
    resolvedActivityId: BOOKING_ACTIVITY_ID,
  });

  return {
    activityId: BOOKING_ACTIVITY_ID,
    formId: toNumber(formId),
  };
};

const buildReservationLabels = (reservas = [], bookingType) => {
  const labels = reservas.map(formatReservationDate).filter(Boolean);

  if (bookingType === 'JORNADA 4 HORAS' && labels.length > 0) {
    return [`Bloque 4 horas: ${labels[0]}${labels.length > 1 ? ` | ${labels[labels.length - 1]}` : ''}`];
  }

  return labels;
};

const buildExistingExternalReference = () => `APP-TBK-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

const getReservationAmount = (productPrice, quantity = 1) => {
  const price = toNumber(productPrice, 0);
  return price * Math.max(quantity, 1);
};

const buildChatUrl = (externalReference) => `${APP_SCHEME}://${PAYMENT_RESULT_PATH}?external_reference=${encodeURIComponent(externalReference)}`;

const parseApiError = (error, fallbackMessage = 'No se pudo completar la solicitud.') => {
  const responseData = error?.response?.data ?? null;
  const httpStatus = error?.response?.status ?? null;
  const backendError = responseData?.error ?? responseData?.code ?? null;
  const message = responseData?.message
    || responseData?.error_message
    || API_ERROR_MESSAGES[backendError]
    || error?.message
    || fallbackMessage;

  return new ApiError(message, {
    httpStatus,
    code: backendError,
    backendError,
    details: responseData,
    originalError: error,
  });
};

const normalizeReservationLockResponse = (data = {}) => {
  const booking = data?.booking ?? data ?? {};

  return {
    bookingId: toNumber(booking?.booking_id ?? booking?.id),
    status: booking?.status ?? booking?.state ?? 'in_cart',
    expirationDate: booking?.expiration_date ?? booking?.expires_at ?? null,
    existing: Boolean(data?.existing ?? booking?.existing),
    raw: data,
  };
};

const resolveReservationExpirationDate = (expirationDate, fallbackMinutes = DEFAULT_EXPIRATION_MINUTES) => {
  const parsedExpiration = parseServerDateTime(expirationDate);
  const now = Date.now();
  const fallbackDate = new Date(now + (fallbackMinutes * 60 * 1000));

  if (!parsedExpiration) {
    return fallbackDate.toISOString();
  }

  const diffMs = parsedExpiration.getTime() - now;
  const maxExpectedMs = (fallbackMinutes + 5) * 60 * 1000;

  if (diffMs <= 0 || diffMs > maxExpectedMs) {
    return fallbackDate.toISOString();
  }

  return parsedExpiration.toISOString();
};

const normalizeReservationPaymentInitResponse = (data = {}) => {
  const booking = data?.booking ?? {};

  return {
    orderId: toNumber(data?.order_id ?? data?.order?.id),
    bookingId: toNumber(booking?.id ?? booking?.booking_id ?? data?.booking_id),
    bookingState: booking?.state ?? booking?.status ?? 'pending',
    existing: Boolean(data?.existing ?? booking?.existing),
    externalReference: data?.external_reference ?? null,
    raw: data,
  };
};

const normalizeReservationPaymentConfirmResponse = (data = {}) => {
  const booking = data?.booking ?? {};
  const payment = data?.payment ?? {};

  return {
    bookingId: toNumber(booking?.id ?? booking?.booking_id ?? data?.booking_id),
    bookingState: booking?.state ?? booking?.status ?? 'booked',
    paymentStatus: payment?.status ?? data?.payment_status ?? 'paid',
    orderId: toNumber(data?.order_id ?? data?.order?.id),
    raw: data,
  };
};

const normalizeCoupon = (coupon = {}) => ({
  code: coupon?.code ?? '',
  amount: coupon?.amount ?? coupon?.discount_amount ?? '',
  expiresAt: coupon?.expires_at ?? coupon?.date_expires ?? null,
  available: coupon?.available ?? coupon?.is_available ?? false,
  sourceOrder: toNumber(coupon?.source_order ?? coupon?.order_id),
  bookingId: toNumber(coupon?.booking_id),
  raw: coupon,
});

const normalizeCouponsResponse = (data = {}) => {
  const coupons = toArray(data?.coupons ?? data?.data ?? data).map(normalizeCoupon);
  return {
    coupons,
    raw: data,
  };
};

const normalizeTransbankInitResponse = (data = {}) => ({
  tokenWs: data?.token_ws ?? data?.token ?? null,
  paymentUrl: data?.payment_url ?? data?.url ?? data?.redirect_url ?? data?.redirectUrl ?? null,
  status: data?.status ?? null,
  raw: data,
});

const normalizeTransbankConfirmResponse = (data = {}) => {
  const status = data?.status ?? data?.response_code ?? data?.data?.status ?? null;
  const successful = Boolean(
    data?.successful
    ?? data?.success
    ?? data?.status === 'AUTHORIZED'
    ?? data?.status === 'paid'
    ?? data?.response_code === 0
    ?? data?.vci === 'TSY'
  );

  return {
    successful,
    transactionId: data?.transaction_id ?? data?.buy_order ?? data?.authorization_code ?? null,
    amount: toNumber(data?.amount ?? data?.data?.amount, 0),
    status,
    paidAt: data?.transaction_date ?? data?.paid_at ?? new Date().toISOString(),
    raw: data,
  };
};

const getReservationErrorMessage = (error) => {
  if (!error) {
    return 'Ocurrió un error inesperado.';
  }

  return error?.message || API_ERROR_MESSAGES[error?.code] || 'Ocurrió un error inesperado.';
};

const isLocalStateResetError = (error) => ['booking_not_found', 'order_not_found'].includes(error?.code);

const isNoAvailabilityError = (error) => error?.code === 'no_availability';

const extractBookingIdFromOrder = (order, localMap = {}) => {
  if (!order) {
    return null;
  }

  const orderId = toNumber(order?.id);

  if (orderId && localMap?.[orderId]) {
    return toNumber(localMap[orderId]);
  }

  const directKeys = ['booking_id', '_booking_id', 'app_booking_id', 'reservation_booking_id'];
  const orderMeta = toArray(order?.meta_data);

  for (const key of directKeys) {
    const metaValue = orderMeta.find((meta) => meta?.key === key)?.value;
    const parsed = toNumber(metaValue);

    if (parsed) {
      return parsed;
    }
  }

  const lineItems = toArray(order?.line_items);

  for (const lineItem of lineItems) {
    const lineMeta = toArray(lineItem?.meta_data);

    for (const key of directKeys) {
      const metaValue = lineMeta.find((meta) => meta?.key === key)?.value;
      const parsed = toNumber(metaValue);

      if (parsed) {
        return parsed;
      }
    }
  }

  return null;
};

export {
  ApiError,
  APP_SCHEME,
  API_ERROR_MESSAGES,
  BOOKING_ACTIVITY_ID,
  DEFAULT_EXPIRATION_MINUTES,
  PAYMENT_RESULT_PATH,
  RESERVATION_STORAGE_KEY,
  TRANSBANK_API_KEY_SECRET,
  TRANSBANK_COMMERCE_CODE,
  TRANSBANK_COMMERCE_NAME,
  TRANSBANK_COMMERCE_RUT,
  TRANSBANK_MODE,
  buildChatUrl,
  buildExistingExternalReference,
  buildReservationLabels,
  extractBookingIdFromOrder,
  formatReservationDate,
  formatReservationStart,
  getDetailProduct,
  getPrimaryProduct,
  getVariationForBookingType,
  getProductBookingConfig,
  getReservationAmount,
  getReservationErrorMessage,
  isLocalStateResetError,
  isNoAvailabilityError,
  normalizeCouponsResponse,
  normalizeCoupon,
  normalizeReservationLockResponse,
  normalizeReservationPaymentConfirmResponse,
  normalizeReservationPaymentInitResponse,
  resolveReservationExpirationDate,
  normalizeTransbankConfirmResponse,
  normalizeTransbankInitResponse,
  parseServerDateTime,
  parseApiError,
  toArray,
  toNumber,
};
