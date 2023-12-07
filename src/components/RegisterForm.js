import React, { useState } from "react";
import { View, Text, SafeAreaView, StyleSheet, Image, TextInput, Alert, TouchableOpacity } from "react-native";
import { RegisterRequest } from "../../service/wp_service";

const images = [
    { logo: require('../../assets/logotipo.png') },
    { background: require('../../assets/SALA-DE-ESPERA.jpg') },
];

const RegisterForm = () => {
    const [formData, setFormData] = useState({
        user_login: '',
        user_pass: '',
        user_email: '',
        display_name: '',
        first_name: '',
        last_name: '',
        phone: '',
        user_dni: '',
        address_user: '',
        profession_user: '',
        university_user: '',
    });
    
    const [currentStep, setCurrentStep] = useState(1);

    const validateFields = () => {
        const requiredFields = {
            1: ['first_name', 'last_name', 'user_dni', 'user_email'],
            2: ['phone', 'address_user', 'university_user', 'profession_user'],
            3: ['user_pass'],
        };

        const currentFields = requiredFields[currentStep];

        if (currentFields.every(field => typeof formData[field] === 'string' && formData[field].trim() !== '')) {
            console.log(formData);
            return true;
        } else {
            console.log(formData)
            Alert.alert('Por Favor, complete todos los campos');
            return false
        }
    };
    const handleNext = () => {
        if (validateFields()) {
            setCurrentStep(currentStep + 1);
        }
        if(currentStep === 3){
            try {
                const DataRegister = RegisterRequest(formData);
                console.log('Se Registro con existo', DataRegister);
                console.log(DataRegister);
            }
           catch (err){
                console.error('Error de registro de usuario', err);
            }
        }
    };
    const handlePrev = () => {
        setCurrentStep(currentStep - 1);
    };
    const renderFormInputs = () => {
        if (currentStep === 1) {
            return (
                <>
                <View style={styles.contentInput}>
                    <TextInput
                            style={styles.input}
                            placeholder="NOMBRES"
                            value={formData.first_name}
                            onChangeText={(text) => setFormData({ ...formData, first_name: text, display_name: text })}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="APELLIDO"
                            value={formData.last_name}
                            onChangeText={(text) => setFormData({ ...formData, last_name: text })}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="RUT"
                            value={formData.user_dni}
                            onChangeText={(text) => setFormData({ ...formData, user_dni: text })}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="CORREO ELECTRONICO"
                            value={formData.user_email}
                            onChangeText={(text) => setFormData({ ...formData, user_email: text, user_login: text })}
                        />
                </View>
                </>
            );
        } else if (currentStep === 2) {
            return (
                <>
                <View style={styles.contentInput}>
                    <TextInput
                            style={styles.input}
                            placeholder="TELÉFONO"
                            value={formData.phone}
                            onChangeText={(text) => setFormData({ ...formData, phone: text })}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="DIRECCIÓN"
                            value={formData.address_user}
                            onChangeText={(text) => setFormData({ ...formData, address_user: text })}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="UNIVERSIDAD QUE OTORGA EL TITULO"
                            value={formData.university_user}
                            onChangeText={(text) => setFormData({ ...formData, university_user: text })}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="PROFESION"
                            value={formData.profession_user}
                            onChangeText={(text) => setFormData({ ...formData, profession_user: text })}
                        />
                </View>
                </>
            );
        } else {
            return (
                <>
                <View styles={styles.contentInput}>

                </View>
                    <TextInput
                        tyle={styles.input}
                        placeholder="CONTRASEÑA"
                        value={formData.user_pass}
                        onChangeText={(text) => setFormData({ ...formData, user_pass: text })}
                    />
                </>
            );
        }
    };
    return (
        <SafeAreaView>
            <View style={styles.contentImage}>
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
                <View>
                    {renderFormInputs()}
                </View>
                {currentStep > 1 && (
                        <TouchableOpacity style={styles.button} onPress={handlePrev}>
                            <Text style={styles.buttonText}>Anterior</Text>
                        </TouchableOpacity>
                    )}
                <TouchableOpacity style={styles.button} onPress={handleNext}>
                    <Text style={styles.buttonText}>
                        {currentStep < 3 ? '>' : 'Enviar'}
                    </Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    contentImage: {
        alignItems: "center",
    },
    imageLogo: {
        width: 300,
        height: 120,
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
    textTitle:{
        fontSize: 40,
        fontWeight: '500',
      },
      contentInput:{
        margin:30,
        alignItems: "center",
      },
      button: {
        height: 60,
        width: 60,
        justifyContent: "center",
        alignItems: "center",
        borderRadius:100,
        backgroundColor: '#A168DE',
      },
      buttonText:{
        fontSize:50
      }
});

export default RegisterForm;