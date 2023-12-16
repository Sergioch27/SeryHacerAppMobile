import React, {useCallback, useState, useEffect} from "react";
import LoginInput from "./smart_components/LoginInput";
import { useNavigation } from '@react-navigation/native';
import {
  StyleSheet,
  Image,
  Alert,
  View,
  Text,
  Pressable,
  SafeAreaView,
  Button,
  Linking,
  Modal
} from "react-native";
import { LoginRequest, LoginOutUser, LoginRequestDev, LoginSuperUser } from "../../service/wp_service";
import Loading from "../components/smart_components/Loading";
import {ModalViewLogin, ModalViewDev} from "./smart_components/Modals";
import AsyncStorage from "@react-native-async-storage/async-storage"

const LoginForm = ()=>{
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isModalVisible1, setIsModalVisible1] = useState(false);
  const [isModalVisible2, setIsModalVisible2] = useState(false);
  const [pressCount, setPressCount] = useState(0);

  const navigation = useNavigation();

const LinkURl = 'https://www.espacioseryhacer.com/privacy-policy';
const OpenURL = ({url, children}) =>{

  const handlePress = useCallback (async ()=>{
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert('Error en Link')
    }
  },[url]);
  return <Button title={children} onPress={handlePress} />;}
const validateFields = () => {
    if (username.trim() !== '' && password.trim() !== '') {
        return true;
    } else {
      setIsModalVisible1(true);
        return false;
    }
};
useEffect(() => {
  if (isModalVisible1) {
      setIsModalVisible1(true);
  }
}, [isModalVisible1]);

const closeModal = () => {
  setIsModalVisible1(false);
};

useEffect(() => {
  if (isModalVisible2) {
      setIsModalVisible2(true);
  }
}, [isModalVisible2]);

const closeModal2 = () => {
  setIsModalVisible2(false);
};

  const images = [
    { logo: require('../../assets/logotipo.png') },
    { background: require('../../assets/SALA-DE-ESPERA.jpg') },
  ];
  const textButton = () => {
    if (loading){
      return <Loading></Loading>
    }else {
      return <Text style={styles.textPressable}>INICIAR SESIÓN</Text>
    }
  }
  const handleLogin = async ()=>{
    if(validateFields()){
        try {
            setLoading(true)
            const DataUser  = await LoginRequest(username,password);
            console.log('Se Inicio Sesión con existo', DataUser);
            Alert.alert('NOMBRE DEL USUARIO: ', DataUser.user_display_name);
          }
          catch (err){
            console.error('Error de inicio de sesión', err);
          }
          finally{
            setLoading(false)
        }
        }
  }
  const handleLogoPress = async () => {
    const newPressCount = pressCount + 1;
    setPressCount(newPressCount);

    if (AsyncStorage.getItem('mod-dev') === 'false' && newPressCount === 10) {
        setIsModalVisible2(true)
    } else if (AsyncStorage.getItem('mod-dev') === 'true' && newPressCount === 10){
      AsyncStorage.setItem('mod-dev', 'false');
      Alert.alert('Modo de desarrollo desactivado');
    }
  }

const handleDev = async ()=>{
        if(validateFields()){
          try {
            setLoading(true)
            const DataUser  = await LoginRequestDev(username,password);
            const DataSuperUser = await LoginSuperUser(DataUser);
            if (DataSuperUser){
                console.log('Se Inicio Sesión como administrador con exitoso', DataUser);
                Alert.alert('NOMBRE DEL USUARIO: ', DataUser.user_display_name);
                setLoading(false)
                AsyncStorage.setItem('mod-dev', 'true');
                console.log('Cambiando a modo de desarrollo');
                // navigation.navigate('AdminView')
        } else{
            console.log('No es administrador');
            Alert.alert('No es administrador');
            setLoading(false)
          }
          }
          catch (err){
            console.error('Error de inicio de sesión', err);
          }
    };
    }

    return (
        <>
        <SafeAreaView >
            <View style={styles.contentImage} >
            <Pressable onPress={handleLogoPress}>
            <Image
                style={styles.imageLogo}
                source={images[0].logo}
            />
            </Pressable>
            </View>
            <View style={styles.contentText}>
              <Text style={styles.textTitle}>
              ESPACIO DE REFLEXIÓN PARA
              LA ACCIÓN.
              </Text>
            </View>
            <View style={styles.contentInput}>
            <LoginInput
            style={styles.input}
                email
                placeholder={'USUARIO'}
                value={username}
                onChangeText={setUsername}
            />
            <LoginInput
            style={styles.input}
                    password
                    placeholder={'CONTRASEÑA'}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={true}
            />
                  <Pressable  style={styles.buttonLogin}  onPress={handleLogin}>
                      {textButton}
                  </Pressable>
            </View>
            <View style={styles.ContentTextSmall}>
                <Pressable onPress={() => navigation.navigate('RecoverPasswordView')}>
                  <Text style={styles.TextSmallPass}>¿Olvidaste tu contraseña?</Text>
                </Pressable>
            </View>
                  <View style={styles.ContainerLine}>
                      <View style={styles.line} />
                        <View style={styles.circle}>
                  <View style={styles.circleInner} />
                    </View>
                  <View style={styles.line} />
                </View>
                <View style={styles.contentInput}>
                  <Pressable  style={styles.buttonLogin}  onPress={() => navigation.navigate('RegisterView')}>
                      <Text style={styles.textPressable}>REGÍSTRATE</Text>
                  </Pressable>
                </View>
                <View style={styles.ContentTextSmall}>
                  <Text style={styles.TextSmall}>Al iniciar sesión o registrarte, aceptas los</Text>
                  <OpenURL url={LinkURl}>términos y políticas de privacidad</OpenURL>
                </View>
            </SafeAreaView>
            <ModalViewLogin
                isVisible={isModalVisible1}
                onClose={closeModal}
                textTitle="Por Favor, complete todos los campos"
                textButton="Cerrar"
              />
              <ModalViewDev
                isVisible={isModalVisible2}
                onClose={closeModal2}
                textButton={textButton}
                sendData={handleDev}
              />
            </>
    )
}
const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
  },
  modalView: {
    margin: 20,
    backgroundColor: "white",
    borderRadius: 20,
    paddingTop:10,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
        width: 0,
        height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5
},

    input: {
        height: 60,
        width:300,
        margin: 15,
        borderWidth: 2,
        borderRadius:10,
        padding: 10,
        shadowColor: "#000000",
    },
    contentImage: {
      alignItems: "center",
    },
    imageLogo:{
      width:300,
      height:120,
    },
    contentInput:{
      margin:30,
      alignItems: "center",
    },
    contentText:{
      margin:30,
      justifyContent: "center",
      alignItems: "center",
    },
    textTitle:{
      fontSize: 40,
      fontWeight: '500',
    },
    buttonLogin:{
      height: 40,
      width: 300,
      justifyContent: "center",
      alignItems: "center",
      borderRadius:15,
      backgroundColor: '#A168DE',
    },
    textPressable:{
      color: 'white',
      fontSize: 16,
      fontWeight: 'bold',
      letterSpacing: 0.25,
    },
    ContainerLine:{
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 20,
    },
    line:{
      height: 1,
      width: 100,
      backgroundColor: 'black',
    },
    circle:{
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: 'black',
      alignItems: 'center',
      justifyContent: 'center',
      marginHorizontal: 10,
    },
    circleInner:{
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: 'white',
    },
    ContentTextSmall:{
      justifyContent: "center",
      alignItems: "center",
    },
    TextSmall:{
      textAlign:"center",
    },
    TextSmallPass:{
      color: 'blue',
      textAlign:"center",
      textDecorationLine: 'underline',
    }
  });

export default LoginForm