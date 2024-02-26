import React, { useState, useRef } from 'react';
import { View, TextInput, Pressable, StyleSheet, Text, Image, SafeAreaView} from 'react-native';
import { RecoverPassword, validateCode, passwordRecover } from '../../service/wp_service';
import { ModalViewLogin } from './smart_components/Modals';
import Loading from './smart_components/Loading';

const RecoveryForm = () => {
  const [form, setForm] = useState({
    email: '',
    code: '',
    password: '',
  });
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const input1Ref = useRef(null);
  const input2Ref = useRef(null);
  const input3Ref = useRef(null);
  const input4Ref = useRef(null);


  const closeModal = () => {
    setIsModalVisible(false);
  };

  const handleTextChange = (text, index) => {
    if (text.length === 1) {
      switch (index) {
        case 1:
          input2Ref.current.focus();
          break;
        case 2:
          input3Ref.current.focus();
          break;
        case 3:
          input4Ref.current.focus();
          break;
        default:
          break;
      }
    }
  };
  const images = [
    { logo: require('../../assets/logotipo.png') },
  ];
  const validateFields = () => {
    const requiredFields = {
        1: ['email'],
        2: ['code'],
        3: ['password'],
    };
        const currentFields = requiredFields[currentStep];
        if(currentFields.every(field => typeof form[field] === 'string' && form[field].trim() !== '')) {
            console.log(form);
            return true;
        } else {
            return false;
        }
};

  const textButton = () => {
    if (currentStep === 1) {
      return (
       loading ? <Loading></Loading> : <Text style={styles.textButton}>ENVIAR</Text>
      )
    } else if (currentStep === 2) {
      return (
        loading ? <Loading></Loading> : <Text style={styles.textButton}>VALIDAR CÓDIGO</Text>
      )
    } else if (currentStep === 3) {
      return (
        loading ? <Loading></Loading> : <Text style={styles.textButton}>CAMBIAR CONTRASEÑA</Text>
      )
    }
  }
const handleRecoverEmail = async () => {
  if(validateFields()){
    console.log(form.email)
    try {
    setLoading(true);
    const DataRecover = await RecoverPassword(form.email);
    setCurrentStep(currentStep + 1);
    console.log('Se envió con éxito', DataRecover);
    console.log(DataRecover.message);
  } catch (err) {
    console.error('Error de envió', err);
  }
  finally{
      setLoading(false);
}
  } else {
    setIsModalVisible(true);
  }
}

const handleRecoverCode = () => {
  console.log(form)
  if(validateFields()){
    const fullCode = `${input1Ref.current.value}${input2Ref.current.value}${input3Ref.current.value}${input4Ref.current.value}`;
    setForm({...form, code: fullCode});
    console.log(fullCode)
    try {
      setLoading(true);
      const email = form.email;
    const DataRecover = validateCode( email, fullCode);
    console.log('Se envió con éxito', DataRecover);
    console.log(DataRecover.message);
      setCurrentStep(currentStep + 1);
  } catch (err) {
    console.error('Error de envió', err);
  }
  finally{
      setLoading(false);
}
  } else {
    setIsModalVisible(true);
  }
}

const handleRecoverPassword = () => {
  if (validateFields()) {
    try {
      setLoading(true);
      const DataRecover = passwordRecover(email, code, password);
      console.log('Se envió con éxito', DataRecover);
      console.log(DataRecover.message);
      setCurrentStep(currentStep + 1);
    } catch (err) {
      console.error('Error de envió', err);
    }
    finally {
      setLoading(false);
    }
    setCurrentStep(currentStep + 1);
  } else {
    setIsModalVisible(true);
  }
}
const renderFormInputs = () => {
  if(currentStep === 1){
    return (
      <View style={styles.contentInput}>
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={form.email}
        onChangeText={(text) => setForm( {...form, email: text})}
      />
        <Pressable  onPress={handleRecoverEmail}>
            {
              <View style={styles.contentText}>
                  <Text style={styles.buttonLogin}>{textButton()}</Text>
              </View>
            }
      </Pressable>
    </View>
    );
  } else if(currentStep === 2){
    return (
      <>
      <View style={styles.contentCod}>
      <TextInput
        style={styles.inputCode}
        keyboardType="numeric"
        maxLength={1}
        onChangeText={(text) => handleTextChange(text, 1)}
        ref={input1Ref}
      />
      <TextInput
        style={styles.inputCode}
        keyboardType="numeric"
        maxLength={1}
        onChangeText={(text) => handleTextChange(text, 2)}
        ref={input2Ref}
      />
      <TextInput
        style={styles.inputCode}
        keyboardType="numeric"
        maxLength={1}
        onChangeText={(text) => handleTextChange(text, 3)}
        ref={input3Ref}
      />
      <TextInput
        style={styles.inputCode}
        keyboardType="numeric"
        maxLength={1}
        onChangeText={(text) => handleTextChange(text, 4)}
        ref={input4Ref}
      />
    </View>
    <View>
    <Pressable  onPress={handleRecoverCode}>
        {
          <View style={styles.contentText}>
              <Text style={styles.buttonLogin}>{textButton()}</Text>
          </View>
        }
      </Pressable>
    </View>
      </>
    );
  } else {
    return (
      <View>
        <TextInput
          style={styles.input}
          placeholder="Contraseña"
          onChangeText={(text) => setForm({...form, password: text})}
          value={form.password}
        />
              <Pressable  onPress={handleRecoverPassword}>
        {
          <View style={styles.contentText}>
              <Text style={styles.buttonLogin}>{textButton()}</Text>
          </View>
        }
      </Pressable>
      </View>
    )
  }
}
return (
    <>
    <SafeAreaView>
      <View style={styles.contentImage} >
              <Image
                  style={styles.imageLogo}
                  source={images[0].logo}
              />
              </View>
              <View style={styles.contentText}>
                <Text style={styles.text}>
                    RECUPERAR CONTRASEÑA
                </Text>
              </View>
        <View style={styles.contentInput}>
          {renderFormInputs()}
        </View>
    </SafeAreaView>
    <ModalViewLogin
        isVisible={isModalVisible}
        onClose={closeModal}
        textTitle="Por Favor, debe indicar correo electrónico"
        textButton="Cerrar"
    />
    </>
)
};

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
inputCode: {
  height: 60,
  width: 60,
  margin: 15,
  borderWidth: 2,
  borderRadius:10,
  padding: 10,
  shadowColor: "#000000",
  fontSize: 30,
  fontWeight: '500',
  textAlign: 'center',
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
contentInput:{
  margin:30,
  alignItems: "center",
},
contentButton: {
  flexDirection: 'row',
  alignSelf: 'center',
},
contentText:{
  justifyContent: "center",
  alignItems: "center",
},
contentImage: {
  alignItems: "center",
},
imageLogo:{
  width:300,
  height:120,
},
text:{
  marginTop: 30,
  fontSize: 20,
  fontWeight: '500',
},
contentCod:{
  flexDirection: 'row',
  justifyContent: 'center',
  alignItems: 'center',
},
});

export default RecoveryForm;
