import React, { useState } from "react";
import { View, Text, SafeAreaView, StyleSheet, Image, TextInput, Alert, TouchableOpacity } from "react-native";

const images = [
    { logo: require('../../assets/logotipo.png') },
    { background: require('../../assets/SALA-DE-ESPERA.jpg') },
];

const RegisterView = () => {
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
        profession_user: '',  // Corregí la tipografía aquí
        university_user: '',
    });
    
    const [currentStep, setCurrentStep] = useState(1);

    const validateFields = () => {
        const currentFields = Object.values(formData).slice(
            (currentStep - 1) * 4,
            currentStep * 4
        );
        if (currentFields.every(field => typeof field === 'string' && field.trim() !== '')) {
            console.log(currentFields);
            return true;
        } else {
            console.log(currentFields);
            Alert.alert('Por Favor, complete todos los campos');
            return false;
        }
    };

    const handleNext = () => {
        if (validateFields()) {
            setCurrentStep(currentStep + 1);
        }
    };

    const renderFormInputs = () => {
        if (currentStep === 1) {
            return (
                <>
                    <TextInput
                        placeholder="Nombres"
                        value={formData.user_login}
                        onChangeText={(text) => setFormData({ ...formData, user_login: text })}
                    />
                    <TextInput
                        placeholder="Apellido"
                        value={formData.user_pass}
                        onChangeText={(text) => setFormData({ ...formData, user_pass: text })}
                    />
                    <TextInput
                        placeholder="RUT"
                        value={formData.user_email}
                        onChangeText={(text) => setFormData({ ...formData, user_email: text })}
                    />
                    <TextInput
                        placeholder="CORREO ELECTRONICO"
                        value={formData.display_name}
                        onChangeText={(text) => setFormData({ ...formData, display_name: text })}
                    />
                </>
            );
        } else if (currentStep === 2) {
            return (
                <>
                    <TextInput
                        placeholder="TELÉFONO"
                        value={formData.phone}
                        onChangeText={(text) => setFormData({ ...formData, phone: text })}
                    />
                    <TextInput
                        placeholder="DIRECCIÓN"
                        value={formData.address_user}
                        onChangeText={(text) => setFormData({ ...formData, address_user: text })}
                    />
                    <TextInput
                        placeholder="UNIVERSIDAD QUE OTORGA EL TITULO"
                        value={formData.university_user}
                        onChangeText={(text) => setFormData({ ...formData, university_user: text })}
                    />
                    <TextInput
                        placeholder="PROFUSION"
                        value={formData.profusion_user}
                        onChangeText={(text) => setFormData({ ...formData, profusion_user: text })}
                    />
                </>
            );
        } else {
            return (
                <>
                    <TextInput
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
                <TouchableOpacity style={styles.button} onPress={handleNext}>
                    <Text style={styles.buttonText}>
                        {currentStep < 3 ? 'Siguiente' : 'Enviar'}
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
});

export default RegisterView;