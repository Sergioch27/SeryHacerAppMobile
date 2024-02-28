import axios from "axios"
import AsyncStorage from "@react-native-async-storage/async-storage"

const API_BASE_URL_DEV = 'https://test.espacioseryhacer.com/wp-json/';
const API_BASE_URL_PRO = 'https://www.espacioseryhacer.com/wp-json/';


const   ApiType = async () => {
    if (await AsyncStorage.getItem('mod-dev') === 'true') {
        return API_BASE_URL_DEV;
    } else {
        return API_BASE_URL_PRO;
    }
}
const LoginRequestDev = async (username,password) => {
        try {
            const DataDev = await axios.post( API_BASE_URL_DEV + 'jwt-auth/v1/token', {
                username,
                password
            });
            const DataUserDev = DataDev.data;
            return DataUserDev.token;
        }
        catch (error) {
            console.error('error de inicio sesión como administrador');
            throw error
        }
}

const LoginDataUser = async (token) => {
    try {
        const DataSuperUser = await axios.get( await ApiType() + 'wp/v2/users/me', {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        await AsyncStorage.setItem('user_id', DataSuperUser.data.id.toString());
        return DataSuperUser.data;
    }
    catch (error) {
        console.error('error de inicio sesión');
        throw error
    }
}

const LoginRequest = async (username,password)=>{
    try {
        console.log(await ApiType());
        const DataLogin = await axios.post( await ApiType() + 'jwt-auth/v1/token', {
            username,
            password
        });
        console.log(DataLogin.data);
        console.log(await ApiType());
        await AsyncStorage.setItem('user_token', DataLogin.data.token);
        console.log(await AsyncStorage.getItem('user_token'));
        return DataLogin.data;
    }
    catch (err){
        console.error('Error de inicio de sesión', err);
        throw err;
    }
}

const LoginOutUser = async()=>{
    await AsyncStorage.removeItem('user_token');
    return true;
}

const RegisterRequest = async (formData)=>{
    try {
        const DataRegister = await axios.post( ApiType + 'app/v1/register', formData);
        return DataRegister.data;
    }
    catch (err){
        console.error('Error de registro de usuario', err);
        throw err;
    }
}

const RecoverPassword = async (email)=>{
    try {
        console.log(ApiType());
        console.log(email);
        const DataRecover = await axios.post( await ApiType() + 'bdpwr/v1/reset-password', {
            email
                });
        return DataRecover.data;
    }
    catch (err){
        console.error('Error de recuperación de contraseña', err);
        throw err;
    }
}
const validateCode = async (email, code)=>{
    console.log(email, code);
    try {
        const DataCode = await axios.post( await ApiType() + 'bdpwr/v1/validate-code', {
            email,
            code
        });
        return DataCode.data;
    }
    catch (err){
        console.error('Error de validación de código', err);
        throw err;
    }
}

const passwordRecover = async (form)=>{
    try {
        const DataRecover = await axios.post( ApiType() + 'bdpwr/v1/reset-password', form);
        return DataRecover.data;
    }
    catch (err){
        console.error('Error de recuperación de contraseña', err);
        throw err;
    }

}
// consultar productos en API
const GetProducts = async (ids)=>{
    const productDetails = []
    console.log(ids);
    for (const id of ids[0].products[0].ids) {
        try {
            const token = await AsyncStorage.getItem('user_token');
            console.log(id);
            const DataProductsVariation = await axios.get( await ApiType() + 'wc/v3/products/' + `${id}` + '/variations', {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            if(DataProductsVariation.data.length === 0){
                const DataProducts = await axios.get( await ApiType() + 'wc/v3/products/' + `${id}`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                productDetails.push(DataProducts.data);
            }else {
                productDetails.push(DataProductsVariation.data);
            }
        }
        catch (err){
            console.error('Error de recuperación de productos', err);
            throw err;
        }
    }
    console.log('LLEGUE',productDetails);
    return productDetails;
};

// consultar productos en API por id de producto padre de variaciones
const GetProductsParent = async (id)=>{
    const productDetailsParents = []
    for (const i of id) {
        try {
            const token = await AsyncStorage.getItem('user_token');
            const DataProducts = await axios.get( await ApiType() + 'wc/v3/products/' + `${i}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            productDetailsParents.push(DataProducts.data);
        }
        catch (err){
            console.error('Error de recuperación de productos', err);
            throw err;
        }
    }
    return productDetailsParents;

};

// consultar disponibilidad de horas en Base de Datos
const GetHours = async (date)=>{
    try {
        const token = await AsyncStorage.getItem('user_token');
        const DataHours = await axios.post( await ApiType() + 'app/v1/checkBooking', {
            date,
        }, {
            headers: {
                Authorization: `Bearer ${token}`
            },
        });
        return DataHours.data;
    }
    catch (err){
        console.error('Error de recuperación de horas', err);
        throw err;
    }
};

const GetOder = async (page)=>{
    try {
        const token = await AsyncStorage.getItem('user_token');
        const DataOder = await axios.get( await ApiType() + 'wc/v3/orders' + `?page=${page}`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return DataOder.data;
    }
    catch (err){
        console.error('Error de recuperación de ordenes', err);
        throw err;
    }
};
export {LoginOutUser, LoginRequest, RegisterRequest, RecoverPassword, LoginRequestDev, LoginDataUser, validateCode, passwordRecover, GetProducts,GetOder,GetHours, GetProductsParent}



