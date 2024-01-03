import { StyleSheet, Text, View, Pressable, Image } from 'react-native'
import React from 'react'
import { AntDesign } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import {LoginOutUser} from '../../../service/wp_service';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSelector, useDispatch } from "react-redux";
import { setModal3 } from "../../features/modal/modalSlice";
import {ModalLoginOut} from '../smart_components/Modals';

const Header = () => {

    const dispatch = useDispatch();
    const isModalVisible3 = useSelector((state) => state.modal.modal3.isOpen);
    const navigation = useNavigation();

    const images = [
        { logo: require('../../../assets/logotipo.png') },
        { background: require('../../../assets/SALA-DE-ESPERA.jpg') },
      ];

    const LoginOut = async () => {
        try {
          const logout =  await LoginOutUser();
          if (logout === true)
          {
            console.log(await AsyncStorage.getItem('user_token'));
            navigation.navigate('LoginView');
          }
        } catch (err) {
          console.error('Error de cierre de sesión', err);
          throw err;
        }
        finally {
          dispatch(setModal3(!isModalVisible3));
        }
    };

  return (
    <>
    <View style={styles.contentImage} >
    <Pressable onPress={()=> dispatch(setModal3(!isModalVisible3))}>
      <View style={styles.LoginOutUser}>
      <AntDesign name="logout" size={24} color="#A168DE" />
        <Text style={styles.textIcon}>
          SALIR
        </Text>
      </View>
    </Pressable>
    <Image
        style={styles.imageLogo}
        source={images[0].logo}
    />
    </View>
    <ModalLoginOut
        isVisible={isModalVisible3}
        onClose={() => dispatch(setModal3(!isModalVisible3))}
        textTitle={'¿Estás seguro que deseas salir?'}
        textButton1={'SALIR'}
        textButton2={'CANCELAR'}
        onLoginOut={LoginOut}
    />

    </>
)
}

const styles = StyleSheet.create({
    contentImage: {
        alignItems: "center",
        height: 100,
        marginTop: 50,
      },
    imageLogo:{
            bottom: 60,
            width:300,
            height:110,
    },
    LoginOutUser:{
        width: 50,
        alignItems: "center",
        alignSelf: 'flex-end',
        marginLeft: 320,
        bottom: 30,
      },
      textIcon:{
        marginTop: 5,
        fontSize: 10,
        fontWeight: '500',
        color: '#A168DE',
      },

})
export default Header