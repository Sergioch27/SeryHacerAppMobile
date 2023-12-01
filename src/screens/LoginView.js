import React, {useCallback, useEffect, useState} from "react";
import LoginInput from "../components/LoginInput";
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
  Linking
} from "react-native";
import { LoginRequest, LoginOutUser } from "../../service/login";
import Loading from "../components/smart_components/Loading";

const LoginView = ()=>{
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
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
  return <Button title={children} onPress={handlePress} />;
}

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
    try {
      setLoading(true)
      const DataUser  = await LoginRequest(username,password);
      console.log('Se Inicio Sesión con existo', DataUser.token);
      Alert.alert('NOMBRE DEL USUARIO: ', DataUser.user_display_name);
    }
    catch (err){
      console.error('Error de inicio de sesión', err);
    }
    finally{
      setLoading(false)
    }
  }
    return (
        <>
        <SafeAreaView >
            <View style={styles.contentImage} >
            <Image
                style={styles.imageLogo}
                source={images[0].logo}
            />
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
            </>
    )
}
const styles = StyleSheet.create({
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
      margin:30,
      justifyContent: "center",
      alignItems: "center",
    },
    TextSmall:{
      textAlign:"center",
    },
  });
export default LoginView