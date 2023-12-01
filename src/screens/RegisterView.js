import React, { useState } from "react";
import { View, Text, SafeAreaView,StyleSheet, Image } from "react-native";
import LoginInput from "../components/LoginInput";
const images = [
    { logo: require('../../assets/logotipo.png') },
    { background: require('../../assets/SALA-DE-ESPERA.jpg') },
  ];

const RegisterView =()=>{
    const [FormData, setFormData] = useState([
        {

        }
    ])
    const [stepForm1,setstepForm1] = useState([
        
    ])
    return (
        <SafeAreaView>
            <View style={styles.contentImage} >
            <Image
                style={styles.imageLogo}
                source={images[0].logo}
            />
            </View>
            <View style={styles.contentText}>
                <Text style={styles.textTitle}>
                    CREA TU CUENTA
                    DATOS BÁSICOS.
                </Text>
            </View>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    contentImage: {
        alignItems: "center",
      },
      imageLogo:{
        width:300,
        height:120,
      },
})

export default RegisterView