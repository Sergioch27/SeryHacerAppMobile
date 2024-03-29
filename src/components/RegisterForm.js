import React, { useState, useEffect } from "react";
import { View, Text, SafeAreaView, StyleSheet, Image, TextInput, Pressable } from "react-native"; // <-- Corregir esta línea
import { RegisterRequest } from "../../service/wp_service";
import { AntDesign } from '@expo/vector-icons';
import {ModalViewLogin} from "./smart_components/Modals";
import { useSelector, useDispatch } from "react-redux";
import { setModal1 } from "../features/modal/modalSlice";


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

    const dispatch = useDispatch();

    const isModalVisible = useSelector((state) => state.modal.modal1.isOpen);


    const validateFields = () => {
        const requiredFields = {
            1: ['first_name', 'last_name', 'user_dni', 'user_email'],
            2: ['phone', 'address_user', 'university_user', 'profession_user'],
            3: ['user_pass'],
        };
            const currentFields = requiredFields[currentStep];
            if(currentFields.every(field => typeof formData[field] === 'string' && formData[field].trim() !== '')) {
                console.log(formData);
                return true;
            } else {
                return false;
            }
    };
    const handleNext = () => {
        if (validateFields()) {
            setCurrentStep(currentStep + 1);
        } else {
            dispatch(setModal1(true));
        }
        if(currentStep === 3){
            try {
                const DataRegister = RegisterRequest(formData);
                console.log('Se Registro con éxito', DataRegister);
                console.log(DataRegister);
            }
           catch (err){
                console.error('Error de registro de usuario', err);
            }
        }
    };
    useEffect(() => {
        if (isModalVisible) {
            dispatch(setModal1(true));
        }
    }, [isModalVisible]);

    const closeModal = () => {
        dispatch(setModal1(false));
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
                            placeholder="CORREO ELECTRÓNICO"
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
                            placeholder="PROFESIÓN"
                            value={formData.profession_user}
                            onChangeText={(text) => setFormData({ ...formData, profession_user: text })}
                        />
                </View>
                </>
            );
        } else {
            return (
                <>
                <View styles={styles.contentInput1}>
                <TextInput
                        password
                        secureTextEntry={true}
                        style={styles.input}
                        placeholder="CONTRASEÑA"
                        value={formData.user_pass}
                        onChangeText={(text) => setFormData({ ...formData, user_pass: text })}
                    />
                </View>
                </>
            );
        }
    };
    return (
        <>
        <SafeAreaView>
            <View style={styles.contentImage}>
                <Image
                    style={styles.imageLogo}
                    source={images[0].logo}
                />
            </View>
            <View style={styles.contentText}>
                <Text style={styles.text}>
                    CREA TU CUENTA
                    DATOS BÁSICOS.
                </Text>
                <View>
                    {renderFormInputs()}
                </View>
                <View style={styles.contentButton}>
                {currentStep > 1 && (
                    <View style={styles.ButtonPrevious}>
                        <Pressable style={styles.button1} onPress={handlePrev}>
                            <AntDesign name="leftcircle" size={60} color="#A168DE" />
                        </Pressable>
                    </View>
                    )}
                <View style={styles.ButtonNext}>
                    <Pressable  onPress={handleNext}>
                        {
                        currentStep < 3 ? <AntDesign  name="rightcircle" size={60} color="#A168DE" /> : 
                        <View style={styles.contentText}>
                            <Text style={styles.buttonLogin}>Enviar</Text>
                        </View>
                        }
                    </Pressable>
                </View>
                </View>
            </View>
        </SafeAreaView>
        <ModalViewLogin
                isVisible={isModalVisible}
                onClose={closeModal}
                textTitle="Por Favor, complete todos los campos"
                textButton="Cerrar"
                />
        </>
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
        padding: 20,
        shadowColor: "#000000",
    },
    text:{
        fontSize: 40,
        fontWeight: '500',
      },
      contentInput:{
        margin:30,
        alignItems: "center",
      },
      contentInput1:{
        flex:1,
        alignItems: "center",
        justifyContent: "center",
        borderColor: '#A168DE',
      },
      button: {
        height: 60,
        width: 60,
        justifyContent: "flex-end",
        alignItems: "end",
        borderRadius:100,

      },
      buttonText:{
        fontSize:50
      },
      contentButton: {
        flexDirection: 'row',
        alignSelf: 'center',
      },
      ButtonPrevious:{
        flex:1,
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'flex-start',
        marginLeft:50
      },
      ButtonNext:{
        flex:1,
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'flex-end',
        marginRight:50
      },
      buttonLogin:{
        height: 40,
        width: 100,
        textAlign: 'center',
        justifyContent: "center",
        alignItems: "flex-end",
        padding:10,
        borderRadius:20,
        backgroundColor: '#A168DE',
      },
  
});

export default RegisterForm;