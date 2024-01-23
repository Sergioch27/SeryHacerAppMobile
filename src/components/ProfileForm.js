import { StyleSheet, Image, View, Text, Pressable } from "react-native"
import React, { useEffect, useState } from 'react'
import { useNavigation } from '@react-navigation/native';
import { useGetImgProfileQuery } from "../../service/FireBaseService";
import Loading from "./smart_components/Loading";
import AsyncStorage from '@react-native-async-storage/async-storage';

const ProfileForm = () => {

    const [loading, setLoading] = useState(true);
    const [userId, setUserId] = useState(null);
    const [profileImage, setProfileImage] = useState(null);

    const setUser = async () => {
        try {
            const user_id = await AsyncStorage.getItem('user_id', user_id);
            setUserId(user_id);
        } catch (error) {
            console.error('Error al obtener usuario', error);
            throw error;
        }
    };
useEffect(() => {
    setUser();
}, [])

    const navigation = useNavigation();
    const {data} = useGetImgProfileQuery({ user_id: userId});

    useEffect(() => {
        setLoading(false);
        if (data) {
            setProfileImage(data.image);
        }
    }, [data]);
    
    return (
        <View style={styles.container}>
        { loading ?
        <Loading></Loading>
        : <Image
                source={ profileImage ? {uri: data.image } : require('../../assets/128-1280406_view-user-icon-png-user-circle-icon-png.png')}
                style={styles.logo}
                resizeMode="cover"
            />}
            <Pressable style={styles.ButtonImg} onPress={()=> navigation.navigate('ProfileChangeImg')}>
                <Text style={styles.buttontext}>Cambiar Foto de Perfil</Text>
            </Pressable>
        </View>
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

export default ProfileForm