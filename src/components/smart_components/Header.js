import { StyleSheet, Text, View, Pressable, Image } from 'react-native'
import React from 'react'
import { AntDesign } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import {LoginOutUser} from '../../../service/wp_service';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSelector, useDispatch } from "react-redux";
import { setModal3 } from "../../features/modal/modalSlice";
import {ModalLoginOut} from '../smart_components/Modals';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const Header = () => {

    const dispatch = useDispatch();
    const isModalVisible3 = useSelector((state) => state.modal.modal3.isOpen);
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();

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
    <View style={[styles.contentImage, { paddingTop: insets.top + 8 }]}>
      <View style={styles.headerRow}>
        <View style={styles.headerSpacer} />
        <Image
            style={styles.imageLogo}
            source={images[0].logo}
        />
        <Pressable onPress={()=> dispatch(setModal3(!isModalVisible3))} style={styles.logoutButton}>
          <AntDesign name="logout" size={24} color="#A168DE" />
          <Text style={styles.textIcon}>
            SALIR
          </Text>
        </Pressable>
      </View>
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
        paddingHorizontal: 20,
        paddingBottom: 12,
      },
    headerRow: {
        minHeight: 92,
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
      },
    headerSpacer: {
        width: 56,
      },
    imageLogo:{
            width:220,
            height:82,
            resizeMode: 'contain',
    },
    logoutButton:{
        width: 56,
        alignItems: "center",
      },
      textIcon:{
        marginTop: 5,
        fontSize: 10,
        fontWeight: '500',
        color: '#A168DE',
      },

})
export default Header
