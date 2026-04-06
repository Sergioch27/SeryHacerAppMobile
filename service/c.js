import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_BASE_URL_DEV = 'https://test.espacioseryhacer.com/wp-json/';
const API_BASE_URL_PRO = 'https://www.espacioseryhacer.com/wp-json/';

const ApiType = async () => {
    if (await AsyncStorage.getItem('mod-dev') === 'true') {
        return API_BASE_URL_DEV;
    }

    return API_BASE_URL_PRO;
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
        console.error('error de inicio sesiÃ³n como administrador');
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
        console.error('error de inicio sesiÃ³n');
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
        console.error('Error de inicio sesiÃ³n', err);
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
        console.error('Error de recuperaciÃ³n de contraseÃ±a', err);
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
        console.error('Error de validaciÃ³n de cÃ³digo', err);
        throw err;
    }
};

const passwordRecover = async (form) => {
    try {
        const DataRecover = await axios.post(await ApiType() + 'bdpwr/v1/set-password', form);
        return DataRecover.data;
    }
    catch (err) {
        console.error('Error de recuperaciÃ³n de contraseÃ±a', err);
        throw err;
    }
};

const GetProducts = async (ids) => {
    const productDetails = [];

    for (const id of ids[0].products[0].ids) {
        try {
            const token = await AsyncStorage.getItem('user_token');
            const DataProductsVariation = await axios.get(await ApiType() + 'wc/v3/products/' + `${id}` + '/variations', {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (DataProductsVariation.data.length === 0) {
                const DataProducts = await axios.get(await ApiType() + 'wc/v3/products/' + `${id}`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                productDetails.push(DataProducts.data);
            } else {
                productDetails.push(DataProductsVariation.data);
            }
        }
        catch (err) {
            console.error('Error de recuperaciÃ³n de productos', err);
            throw err;
        }
    }

    return productDetails;
};

const GetProductsParent = async (id) => {
    const productDetailsParents = [];

    for (const i of id) {
        try {
            const token = await AsyncStorage.getItem('user_token');
            const DataProducts = await axios.get(await ApiType() + 'wc/v3/products/' + `${i}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            productDetailsParents.push(DataProducts.data);
        }
        catch (err) {
            console.error('Error de recuperaciÃ³n de productos', err);
            throw err;
        }
    }

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
        console.error('Error de recuperaciÃ³n de horas', err);
        throw err;
    }
};

const GetOder = async (page) => {
    try {
        const token = await AsyncStorage.getItem('user_token');
        const DataOder = await axios.get(await ApiType() + 'wc/v3/orders' + `?page=${page}`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return DataOder.data;
    }
    catch (err) {
        console.error('Error de recuperaciÃ³n de ordenes', err);
        throw err;
    }
};

export {
    GetHours,
    GetOder,
    GetProducts,
    GetProductsParent,
    LoginDataUser,
    LoginOutUser,
    LoginRequest,
    LoginRequestDev,
    RecoverPassword,
    RegisterRequest,
    passwordRecover,
    validateCode,
};
