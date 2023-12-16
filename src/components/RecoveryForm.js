import React, { useState } from 'react';
import { View, TextInput, Pressable, StyleSheet, Text, Image} from 'react-native';
import { RecoverPassword } from '../../service/wp_service';

const RecoveryForm = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const images = [
    { logo: require('../../assets/logotipo.png') },
    { background: require('../../assets/SALA-DE-ESPERA.jpg') },
  ];

  const textButton = () => {
    if (loading) {
      return <Loading></Loading>;
    } else {
      return <Text style={styles.textButton}>Enviar</Text>;
    }
  }
const handleRecover = () => {
    try {
        setLoading(true);
      const DataRecover = RecoverPassword(email);
      console.log('Se envió con éxito', DataRecover);
      console.log(DataRecover);
    } catch (err) {
      console.error('Error de envió', err);
    }
    finally{
        setLoading(false);
  }
}
return (
    <>
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
        <TextInput
          style={styles.input}
          placeholder="Email"
          onChangeText={(text) => setEmail(text)}
          value={email}
        />
      </View>
      <View style={styles.contentButton}>
        <Pressable  onPress={handleRecover}>
                        {
                        <View style={styles.contentText}>
                            <Text style={styles.buttonLogin}>{textButton()}</Text>
                        </View>
                        }
       </Pressable>
      </View>
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
});

export default RecoveryForm;
