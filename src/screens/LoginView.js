import React from "react";
import LoginInput from "../components/LoginInput";
import {
  StyleSheet,
  Image,
  Alert,
  View,
  Text,
  Pressable,
  SafeAreaView 
} from "react-native";



  const images = [
    { logo: require('../../assets/logotipo.png') },
    { background: require('../../assets/SALA-DE-ESPERA.jpg') },
  ];


  const LoginView = ()=>{
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
        />
        <LoginInput
        style={styles.input}
                password
                placeholder={'CONTRASEÑA'}
                secureTextEntry={true}
        />
              <Pressable  style={styles.buttonLogin}  onPress={() => Alert.alert('Simple Button pressed')}>
                  <Text style={styles.textPressable}>INICIAR SESIÓN</Text>
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
              <Pressable  style={styles.buttonLogin}  onPress={() => Alert.alert('Simple Button pressed')}>
                  <Text style={styles.textPressable}>REGÍSTRATE</Text>
              </Pressable>
            </View>

            <View style={styles.ContentTextSmall}>
              <Text style={styles.TextSmall}>Al iniciar sesión o registrarte, aceptas los términos y políticas de privacidad</Text>
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