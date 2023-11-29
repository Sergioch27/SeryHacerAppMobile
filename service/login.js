import axios from "axios"
import AsyncStorage from "@react-native-async-storage/async-storage"

const API_BASE_URL = 'https://www.espacioseryhacer.com/wp-json/';

const LoginRequest = async (username,password)=>{
    try {
        const DataLogin = await axios.post(API_BASE_URL + 'jwt-auth/v1/token', {
            username,
            password
        });
        const DataUser = DataLogin.data;
        await AsyncStorage.setItem('user_token', DataUser.token);
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
export {LoginOutUser, LoginRequest}