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
            user_login: '',
            user_pass: '',
            user_email: '',
            display_name: '',
            first_name: '',
            last_name: '',
            phone: '',
            user_dni: '',
            address_user: '',
            profesión_user: '',
            university_user: '',
            refer_user: ''
        }
    ])
    const [stepForm1,setstepForm1] = useState([
        {
            user_login: '',
            first_name: '',
            last_name: '',
            user_dni: '',
        }
    ])
    const [stepForm2,setstepForm2] = useState([
        {
            user_pass: '',
        }
    ])
    const [stepForm3,setstepForm3] = useState([
        {
            phone: '',
            address_user: '',
            profesión_user: '',
            university_user: '',
        }
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