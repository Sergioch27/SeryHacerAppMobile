import Constants from 'expo-constants';

const normalizeString = (value) => {
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim();
};

const normalizeBaseUrl = (value, fallback = '') => {
  const normalizedValue = normalizeString(value || fallback);
  return normalizedValue.replace(/\/+$/, '');
};

const getExpoExtraConfig = () => (
  Constants?.expoConfig?.extra
  ?? Constants?.manifest?.extra
  ?? {}
);

const extra = getExpoExtraConfig();

const appConfig = {
  transbankBaseUrl: normalizeBaseUrl(extra?.transbankBaseUrl, 'https://pago.espacioseryhacer.com'),
  transbankMode: normalizeString(extra?.transbankMode) || 'INTEGRACION',
  transbankCommerceName: normalizeString(extra?.transbankCommerceName),
  transbankCommerceRut: normalizeString(extra?.transbankCommerceRut),
  transbankUserToken: normalizeString(extra?.transbankUserToken),
};

export {
  appConfig,
};
