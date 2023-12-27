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

const LoginSuperUser = async (token) => {
    try {
        const DataSuperUser = await axios.get( API_BASE_URL_DEV + 'wp/v2/users/me', {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return DataSuperUser.data.is_super_admin;
    }
    catch (error) {
        console.error('error de inicio sesión como administrador');
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
    try {
        const DataCode = await axios.post( ApiType() + 'bdpwr/v1/validate-code', {
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

const GetProducts = async (ids)=>{
    const productDetails = []
    for (const id of ids) {
        try {
            const token = await AsyncStorage.getItem('user_token');
            const DataProducts = await axios.get( ApiType() + 'wc/v3/products/' + `${id}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            productDetails.push(DataProducts.data);
        }
        catch (err){
            console.error('Error de recuperación de productos', err);
            throw err;
        }
    }
    return productDetails;
};
export {LoginOutUser, LoginRequest, RegisterRequest, RecoverPassword, LoginRequestDev, LoginSuperUser, validateCode, passwordRecover, GetProducts}