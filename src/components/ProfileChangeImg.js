import { StyleSheet, Text, SafeAreaView, Image, View, Pressable } from 'react-native'
import React, { useState } from 'react'
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePostProfileImgMutation } from '../../service/FireBaseService';
import Loading from "./smart_components/Loading";


const ProfileChangeImg = ({navigation}) => {

    const [selectedImg, setSelectedImg] = useState(null);
    const [triggerProfileImg] = usePostProfileImgMutation();
    const [loading, setLoading] = useState(false);

    const SelectImg = async () => {
        const {granted} = await ImagePicker.requestCameraPermissionsAsync();
        if(granted){
            let data = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                base64: true,
                allowsEditing: true,
                aspect: [3,3],
                quality: 0.5,
            });
            console.log(data)
            if(!data.canceled){
                setSelectedImg('data:image/jpeg;base64,' + data.assets[0].base64);
            }
        }

    }
    const SaveImg = async () => {
        try {
            setLoading(true);
            const UserId = await AsyncStorage.getItem('user_id');
            triggerProfileImg({user_id: UserId, image: selectedImg});
            navigation.goBack();
            console.log('Guardar Imagen');
            } catch (error) {
            console.error('Error al guardar imagen', error);
            throw error;
        }
        finally {
            setLoading(false);
        }
    }

return (
    <SafeAreaView>
        <View style={styles.container}>
            <Image
                source={selectedImg ? {uri: selectedImg } : require('../../assets/128-1280406_view-user-icon-png-user-circle-icon-png.png')}
                style={styles.logo}
                resizeMode="cover"
            />
            <Pressable style={styles.ButtonImg} onPress={SelectImg}>
                <Text style={styles.buttontext}>Seleccionar Foto</Text>
            </Pressable>
            <Pressable style={styles.ButtonImg} onPress={SaveImg}>
                <Text style={styles.buttontext}>{loading ? <Loading></Loading> : 'Guardar Foto'}</Text>
            </Pressable>
        </View>
    </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#fff',
        justifyContent: 'center',
    },
    logo: {
        width: 150,
        height: 150,
        marginLeft: 120,
        marginRight: 120,
        marginTop: 20,
        marginBottom: 20,
        borderRadius: 100,
    },
    ButtonImg: {
        marginLeft: 100,
        marginRight: 100,
        marginBottom: 20,
        borderRadius: 10,
        backgroundColor: '#A168DE',
        padding: 10,
        alignItems: 'center',
        height: 40,
        width: 200,
    },
    buttontext: {
        color: '#fff',
        fontSize: 15,
        fontWeight: 'bold',
    }

})
export default ProfileChangeImg