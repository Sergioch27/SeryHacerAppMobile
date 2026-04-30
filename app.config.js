const { expo } = require('./app.json');

module.exports = () => ({
  ...expo,
  extra: {
    ...(expo.extra || {}),
    transbankBaseUrl: process.env.EXPO_PUBLIC_TRANSBANK_BASE_URL || 'https://pago.espacioseryhacer.com',
    transbankMode: process.env.EXPO_PUBLIC_TRANSBANK_MODE || 'INTEGRACION',
    transbankCommerceName: process.env.EXPO_PUBLIC_TRANSBANK_COMMERCE_NAME || '',
    transbankCommerceRut: process.env.EXPO_PUBLIC_TRANSBANK_COMMERCE_RUT || '',
    transbankUserToken: process.env.EXPO_PUBLIC_TRANSBANK_USER_TOKEN || '',
  },
});
