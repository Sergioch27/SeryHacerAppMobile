import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
    DEFAULT_EXPIRATION_MINUTES,
    buildChatUrl,
    normalizeCouponsResponse,
    normalizeReservationLockResponse,
    normalizeReservationPaymentConfirmResponse,
    normalizeReservationPaymentInitResponse,
    parseApiError,
} from "./mobile_reservation_models";

const API_BASE_URL_DEV = 'https://test.espacioseryhacer.com/wp-json/';
const API_BASE_URL_PRO = 'https://www.espacioseryhacer.com/wp-json/';
const RETRY_ATTEMPTS = 2;

const ApiType = async () => {
    if (await AsyncStorage.getItem('mod-dev') === 'true') {
        return API_BASE_URL_DEV;
    }

    return API_BASE_URL_PRO;
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const shouldRetryRequest = (error) => {
    const status = error?.response?.status;

    if (!status) {
        return true;
    }

    return status >= 500 || status === 429;
};

const withRetries = async (requestFn, attempts = RETRY_ATTEMPTS) => {
    let lastError;

    for (let attempt = 0; attempt <= attempts; attempt++) {
        try {
            return await requestFn();
        }
        catch (error) {
            lastError = error;

            if (attempt === attempts || !shouldRetryRequest(error)) {
                throw error;
            }

            await delay(400 * (attempt + 1));
        }
    }

    throw lastError;
};

const getAuthContext = async () => {
    const token = await AsyncStorage.getItem('user_token');
    let userId = await AsyncStorage.getItem('user_id');
    const apiBaseUrl = await ApiType();

    if (!userId && token) {
        try {
            const DataUser = await withRetries(() => axios.get(apiBaseUrl + 'wp/v2/users/me', {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }));
            userId = DataUser.data?.id?.toString();

            if (userId) {
                await AsyncStorage.setItem('user_id', userId);
            }
        }
        catch (error) {
            console.error('[getAuthContext] no se pudo recuperar user_id', error?.response?.data ?? error.message);
        }
    }

    return {
        token,
        userId,
    };
};

const LoginRequestDev = async (username, password) => {
    try {
        const DataDev = await axios.post(API_BASE_URL_DEV + 'jwt-auth/v1/token', {
            username,
            password
        });
        return DataDev.data.token;
    }
    catch (error) {
        console.error('error de inicio sesiÃƒÂ³n como administrador');
        throw error;
    }
};

const LoginDataUser = async (token) => {
    try {
        const DataSuperUser = await axios.get(await ApiType() + 'wp/v2/users/me', {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        await AsyncStorage.setItem('user_id', DataSuperUser.data.id.toString());
        return DataSuperUser.data;
    }
    catch (error) {
        console.error('error de inicio sesiÃƒÂ³n');
        throw error;
    }
};

const GetCurrentUserProfile = async (options = {}) => {
    try {
        const { includeCustomerData = true } = options;
        const { token, userId } = await getAuthContext();
        const apiBaseUrl = await ApiType();
        let DataUser;

        try {
            DataUser = await withRetries(() => axios.get(apiBaseUrl + 'wp/v2/users/me?context=edit', {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }));
            console.log('[GetCurrentUserProfile] loaded profile with context=edit');
        }
        catch (profileEditError) {
            console.log('[GetCurrentUserProfile] context=edit failed:', {
                status: profileEditError?.response?.status ?? null,
                data: profileEditError?.response?.data ?? null,
                message: profileEditError?.message ?? null,
            });

            DataUser = await withRetries(() => axios.get(apiBaseUrl + 'wp/v2/users/me', {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }));
            console.log('[GetCurrentUserProfile] loaded profile without context=edit');
        }

        let customerData = null;

        if (includeCustomerData && userId) {
            try {
                const DataCustomer = await withRetries(() => axios.get(apiBaseUrl + 'wc/v3/customers/' + `${userId}`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }));
                customerData = DataCustomer.data;
            }
            catch (customerError) {
                console.log('[GetCurrentUserProfile] sin datos de cliente WooCommerce:', customerError?.response?.status ?? customerError.message);
            }
        }

        const wpUser = DataUser.data ?? {};
        const billing = customerData?.billing ?? {};
        const shipping = customerData?.shipping ?? {};

        return {
            ...wpUser,
            customer_id: customerData?.id ?? null,
            billing,
            shipping,
            first_name: customerData?.first_name ?? wpUser?.first_name ?? '',
            last_name: customerData?.last_name ?? wpUser?.last_name ?? '',
            avatar_url: wpUser?.avatar_urls?.['96'] ?? wpUser?.avatar_urls?.['48'] ?? null,
            meta_data: customerData?.meta_data ?? wpUser?.meta_data ?? [],
        };
    }
    catch (error) {
        console.error('Error obteniendo perfil de usuario', error);
        throw error;
    }
};

const LoginRequest = async (username, password) => {
    try {
        const DataLogin = await axios.post(await ApiType() + 'jwt-auth/v1/token', {
            username,
            password
        });
        await AsyncStorage.setItem('user_token', DataLogin.data.token);
        return DataLogin.data;
    }
    catch (err) {
        console.error('Error de inicio sesiÃƒÂ³n', err);
        throw err;
    }
};

const LoginOutUser = async () => {
    await AsyncStorage.removeItem('user_token');
    return true;
};

const RegisterRequest = async (formData) => {
    try {
        const DataRegister = await axios.post(await ApiType() + 'app/v1/register', formData);
        return DataRegister.data;
    }
    catch (err) {
        console.error('Error de registro de usuario', err);
        throw err;
    }
};

const RecoverPassword = async (email) => {
    try {
        const DataRecover = await axios.post(await ApiType() + 'bdpwr/v1/reset-password', {
            email
        });
        return DataRecover.data;
    }
    catch (err) {
        console.error('Error de recuperaciÃƒÂ³n de contraseÃƒÂ±a', err);
        throw err;
    }
};

const validateCode = async (email, code) => {
    try {
        const DataCode = await axios.post(await ApiType() + 'bdpwr/v1/validate-code', {
            email,
            code
        });
        return DataCode.data;
    }
    catch (err) {
        console.error('Error de validaciÃƒÂ³n de cÃƒÂ³digo', err);
        throw err;
    }
};

const passwordRecover = async (form) => {
    try {
        const DataRecover = await axios.post(await ApiType() + 'bdpwr/v1/set-password', form);
        return DataRecover.data;
    }
    catch (err) {
        console.error('Error de recuperaciÃƒÂ³n de contraseÃƒÂ±a', err);
        throw err;
    }
};

const GetProducts = async (ids) => {
    const productDetails = [];
    const productIds = ids?.[0]?.products?.[0]?.ids ?? [];
    const { token } = await getAuthContext();
    const apiBaseUrl = await ApiType();

    console.log('[GetProducts] ids configurados:', productIds);

    for (const id of productIds) {
        try {
            console.log(`[GetProducts] consultando producto ${id}`);
            let productVariations = [];

            try {
                const DataProductsVariation = await withRetries(() => axios.get(apiBaseUrl + 'wc/v3/products/' + `${id}` + '/variations', {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }));

                productVariations = Array.isArray(DataProductsVariation.data) ? DataProductsVariation.data : [];
                console.log(`[GetProducts] variaciones producto ${id}:`, productVariations.length);
            }
            catch (variationErr) {
                const status = variationErr?.response?.status;
                console.log(`[GetProducts] sin variaciones o error controlado para producto ${id}:`, status ?? variationErr.message);

                if (status && status !== 404) {
                    throw variationErr;
                }
            }

            if (productVariations.length > 0) {
                productDetails.push(productVariations);
                console.log(`[GetProducts] producto ${id} agregado como variaciones`);
                continue;
            }

            const DataProducts = await withRetries(() => axios.get(apiBaseUrl + 'wc/v3/products/' + `${id}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }));

            console.log(`[GetProducts] producto simple ${id}:`, DataProducts.data?.name, DataProducts.data?.type);
            productDetails.push(DataProducts.data);
        }
        catch (err) {
            console.error(`[GetProducts] Error recuperando producto ${id}`, err?.response?.data ?? err.message);
        }
    }

    console.log('[GetProducts] total productos recuperados:', productDetails.length, productDetails);
    return productDetails;
};

const GetProductsParent = async (id) => {
    const productDetailsParents = [];
    const { token } = await getAuthContext();
    const apiBaseUrl = await ApiType();

    for (const i of id) {
        try {
            console.log(`[GetProductsParent] consultando parent ${i}`);
            const DataProducts = await withRetries(() => axios.get(apiBaseUrl + 'wc/v3/products/' + `${i}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }));
            productDetailsParents.push(DataProducts.data);
        }
        catch (err) {
            console.error(`[GetProductsParent] error recuperando parent ${i}`, err?.response?.data ?? err.message);
        }
    }

    console.log('[GetProductsParent] total parents recuperados:', productDetailsParents.length, productDetailsParents);
    return productDetailsParents;
};

const GetHours = async (date) => {
    try {
        const token = await AsyncStorage.getItem('user_token');
        const DataHours = await axios.post(await ApiType() + 'app/v1/checkBooking', {
            date,
        }, {
            headers: {
                Authorization: `Bearer ${token}`
            },
        });
        return DataHours.data;
    }
    catch (err) {
        console.error('Error de recuperaciÃƒÂ³n de horas', err);
        throw err;
    }
};

const GetOder = async (page) => {
    try {
        const { token, userId } = await getAuthContext();
        const apiBaseUrl = await ApiType();

        if (!userId) {
            return [];
        }

        const DataOder = await withRetries(() => axios.get(apiBaseUrl + 'wc/v3/orders' + `?page=${page}&customer=${userId}`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }));
        return DataOder.data;
    }
    catch (err) {
        console.error('Error de recuperaciÃƒÂ³n de ordenes', err);
        throw err;
    }
};

const GetOrderById = async (id) => {
    try {
        const { token, userId } = await getAuthContext();
        const apiBaseUrl = await ApiType();
        const DataOrder = await withRetries(() => axios.get(apiBaseUrl + 'wc/v3/orders/' + `${id}`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }));

        if (userId && DataOrder.data?.customer_id?.toString() !== userId.toString()) {
            throw new Error('Orden no autorizada para este usuario');
        }

        return DataOrder.data;
    }
    catch (err) {
        console.error('Error de recuperaciÃƒÂ³n de detalle de orden', err);
        throw err;
    }
};

const CreateOrder = async (payload) => {
    try {
        const token = await AsyncStorage.getItem('user_token');
        const userId = await AsyncStorage.getItem('user_id');
        const orderPayload = {
            customer_id: userId ? Number(userId) : undefined,
            status: 'processing',
            ...payload,
        };

        console.log('[CreateOrder] payload:', orderPayload);

        const DataOrder = await axios.post(await ApiType() + 'wc/v3/orders', orderPayload, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        console.log('[CreateOrder] respuesta:', DataOrder.data);
        return DataOrder.data;
    }
    catch (err) {
        console.error('[CreateOrder] error creando orden', err?.response?.data ?? err.message);
        throw err;
    }
};

const getAppApiBaseUrl = async () => `${await ApiType()}app/v1`;

const getAuthHeaders = async () => {
    const { token } = await getAuthContext();

    if (!token) {
        throw new Error('No hay sesiÃ³n activa.');
    }

    return {
        Authorization: `Bearer ${token}`
    };
};

const appPost = async (path, payload) => {
    try {
        const url = `${await getAppApiBaseUrl()}/${path}`;
        const headers = await getAuthHeaders();
        const response = await withRetries(() => axios.post(url, payload, {
            headers,
        }));
        return response.data;
    }
    catch (error) {
        console.log('[appPost] error', {
            path,
            status: error?.response?.status ?? null,
            data: error?.response?.data ?? null,
        });
        throw parseApiError(error, 'No se pudo completar la solicitud con el backend.');
    }
};

const buildCheckoutCustomer = async (profileOverride = null) => {
    const profile = profileOverride ?? await GetCurrentUserProfile({ includeCustomerData: false });
    const userId = profile?.id ?? profile?.customer_id ?? null;
    const metaData = Array.isArray(profile?.meta_data) ? profile.meta_data : [];
    const getMetaValue = (key) => metaData.find((item) => item?.key === key)?.value || '';

    return {
        user_id: userId ? Number(userId) : undefined,
        first_name: profile?.first_name ?? '',
        last_name: profile?.last_name ?? '',
        email: profile?.email ?? '',
        phone: profile?.billing?.phone ?? '',
        document_id: getMetaValue('user_dni'),
        address_1: profile?.billing?.address_1 ?? '',
        address_2: profile?.billing?.address_2 ?? '',
        city: profile?.billing?.city ?? '',
        state: profile?.billing?.state ?? '',
        postcode: profile?.billing?.postcode ?? '',
        country: profile?.billing?.country ?? 'CL',
    };
};

const LockMobileReservationCart = async ({ booking, customer }) => {
    const response = await appPost('mobile-reservation-cart-lock', {
        booking: {
            ...booking,
            expiration_minutes: booking?.expiration_minutes ?? DEFAULT_EXPIRATION_MINUTES,
        },
        customer,
    });

    return normalizeReservationLockResponse(response);
};

const InitMobileReservationPayment = async ({
    externalReference,
    bookingId,
    product,
    customer,
    payment,
    meta,
}) => {
    const resolvedCustomer = customer ?? await buildCheckoutCustomer();
    const payload = {
        external_reference: externalReference,
        booking_id: bookingId,
        product,
        customer: resolvedCustomer,
        payment,
        meta,
    };

    console.log('[InitMobileReservationPayment] payload:', JSON.stringify(payload, null, 2));

    const response = await appPost('mobile-reservation-payment-init', payload);

    return normalizeReservationPaymentInitResponse(response);
};

const ConfirmMobileReservationPayment = async ({
    orderId,
    bookingId,
    externalReference,
    payment,
    orderStatus = 'processing',
}) => {
    const payload = {
        payment,
        order_status: orderStatus,
    };

    if (orderId) {
        payload.order_id = orderId;
    }

    if (bookingId) {
        payload.booking_id = bookingId;
    }

    if (externalReference) {
        payload.external_reference = externalReference;
    }

    const response = await appPost('mobile-reservation-payment-confirm', payload);
    return normalizeReservationPaymentConfirmResponse(response);
};

const RemoveMobileReservationCart = async ({ bookingId, externalReference }) => {
    return appPost('mobile-reservation-cart-remove', bookingId ? {
        booking_id: bookingId,
    } : {
        external_reference: externalReference,
    });
};

const ExpireMobileReservation = async ({ bookingId }) => {
    return appPost('mobile-reservation-expire', {
        booking_id: bookingId,
    });
};

const CancelMobileReservationOrder = async ({ orderId, bookingId, reason }) => {
    const response = await appPost('mobile-order-cancel', {
        order_id: orderId,
        booking_id: bookingId,
        reason,
    });

    return {
        ...response,
        coupon: response?.coupon ?? null,
    };
};

const GetMobileCoupons = async ({ userId, email, availableOnly = true }) => {
    const payload = {
        available_only: availableOnly,
    };

    if (userId) {
        payload.user_id = userId;
    }
    else if (email) {
        payload.email = email;
    }

    const response = await appPost('mobile-coupons', payload);
    return normalizeCouponsResponse(response);
};

const getPaymentConfirmationCallbackUrl = async () => `${await getAppApiBaseUrl()}/mobile-reservation-payment-confirm`;

export {
    ApiType,
    CancelMobileReservationOrder,
    ConfirmMobileReservationPayment,
    CreateOrder,
    ExpireMobileReservation,
    GetHours,
    GetMobileCoupons,
    GetOder,
    GetOrderById,
    GetCurrentUserProfile,
    GetProducts,
    GetProductsParent,
    InitMobileReservationPayment,
    LockMobileReservationCart,
    LoginDataUser,
    LoginOutUser,
    LoginRequest,
    LoginRequestDev,
    RecoverPassword,
    RegisterRequest,
    RemoveMobileReservationCart,
    appPost,
    buildChatUrl as BuildChatUrl,
    buildCheckoutCustomer,
    getAppApiBaseUrl,
    getAuthContext,
    getAuthHeaders,
    getPaymentConfirmationCallbackUrl,
    passwordRecover,
    validateCode,
};

