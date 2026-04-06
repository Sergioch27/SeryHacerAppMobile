import { StyleSheet, Image, View, Text, Pressable, ScrollView } from "react-native"
import React, { useEffect, useState } from 'react'
import { useNavigation } from '@react-navigation/native';
import { useGetImgProfileQuery } from "../../service/FireBaseService";
import Loading from "./smart_components/Loading";
import AsyncStorage from '@react-native-async-storage/async-storage';
import Header from './smart_components/Header';
import { GetCurrentUserProfile } from '../../service/wp_service';

const ProfileForm = () => {

    const [loading, setLoading] = useState(true);
    const [userId, setUserId] = useState(null);
    const [profileImage, setProfileImage] = useState(null);
    const [userProfile, setUserProfile] = useState(null);

    const setUser = async () => {
        try {
            const user_id = await AsyncStorage.getItem('user_id');
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
        if (data) {
            setProfileImage(data.image);
        }
    }, [data]);

    useEffect(() => {
        const getProfile = async () => {
            try {
                setLoading(true);
                const profile = await GetCurrentUserProfile();
                setUserProfile(profile);
            } catch (error) {
                console.error('Error al cargar perfil', error);
            } finally {
                setLoading(false);
            }
        };

        getProfile();
    }, []);

    const profileName = userProfile?.name || userProfile?.username || 'Usuario';
    const profileEmail = userProfile?.email || 'Sin correo';
    const profileUsername = userProfile?.username || 'Sin usuario';
    const fullName = `${userProfile?.first_name ?? ''} ${userProfile?.last_name ?? ''}`.trim() || profileName;
    const billingAddress = [
        userProfile?.billing?.address_1,
        userProfile?.billing?.address_2,
        userProfile?.billing?.city,
        userProfile?.billing?.state,
    ].filter(Boolean).join(', ') || 'Sin dirección';
    const phoneNumber = userProfile?.billing?.phone || 'Sin teléfono';
    const metaData = Array.isArray(userProfile?.meta_data) ? userProfile.meta_data : [];
    const getMetaValue = (key) => metaData.find((item) => item?.key === key)?.value || '';
    const userRut = getMetaValue('user_dni');
    const profession = getMetaValue('profession_user');
    const university = getMetaValue('university_user');

    return (
        <View style={styles.container}>
            <Header />
            {loading ? (
                <View style={styles.loadingContainer}>
                    <Loading />
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.heroCard}>
                        <Image
                            source={ profileImage ? {uri: profileImage } : require('../../assets/128-1280406_view-user-icon-png-user-circle-icon-png.png')}
                            style={styles.logo}
                            resizeMode="cover"
                        />
                        <Text style={styles.profileName}>{fullName}</Text>
                        <Text style={styles.profileSubtitle}>{profileEmail}</Text>
                        <Pressable style={styles.buttonImg} onPress={()=> navigation.navigate('ProfileChangeImg')}>
                            <Text style={styles.buttonText}>Cambiar Foto de Perfil</Text>
                        </Pressable>
                    </View>

                    <View style={styles.infoCard}>
                        <Text style={styles.cardTitle}>Información del usuario</Text>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Nombre</Text>
                            <Text style={styles.infoValue}>{fullName}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Usuario</Text>
                            <Text style={styles.infoValue}>{profileUsername}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Correo</Text>
                            <Text style={styles.infoValue}>{profileEmail}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>ID</Text>
                            <Text style={styles.infoValue}>{userProfile?.id?.toString() ?? userId ?? '-'}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Teléfono</Text>
                            <Text style={styles.infoValue}>{phoneNumber}</Text>
                        </View>
                        {userRut ? (
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>RUT</Text>
                                <Text style={styles.infoValue}>{userRut}</Text>
                            </View>
                        ) : null}
                    </View>

                    <View style={styles.infoCard}>
                        <Text style={styles.cardTitle}>Direcciones</Text>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Facturación</Text>
                            <Text style={styles.infoValue}>{billingAddress}</Text>
                        </View>
                    </View>

                    {(profession || university) ? (
                    <View style={styles.infoCard}>
                        <Text style={styles.cardTitle}>Información profesional</Text>
                        {profession ? (
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>Profesión</Text>
                                <Text style={styles.infoValue}>{profession}</Text>
                            </View>
                        ) : null}
                        {university ? (
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>Universidad</Text>
                                <Text style={styles.infoValue}>{university}</Text>
                            </View>
                        ) : null}
                    </View>
                    ) : null}
                </ScrollView>
            )}
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    heroCard: {
        backgroundColor: '#ffffff',
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        shadowColor: '#000000',
        shadowOpacity: 0.08,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 3,
    },
    logo: {
        width: 150,
        height: 150,
        marginBottom: 20,
        borderRadius: 100,
    },
    profileName: {
        fontSize: 24,
        fontWeight: '700',
        color: '#222222',
    },
    profileSubtitle: {
        marginTop: 6,
        marginBottom: 18,
        fontSize: 14,
        color: '#666666',
    },
    buttonImg: {
        borderRadius: 10,
        backgroundColor: '#A168DE',
        paddingVertical: 12,
        paddingHorizontal: 20,
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: 'bold',
    },
    infoCard: {
        marginTop: 18,
        backgroundColor: '#ffffff',
        borderRadius: 24,
        padding: 20,
        shadowColor: '#000000',
        shadowOpacity: 0.08,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 3,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#222222',
        marginBottom: 16,
    },
    infoRow: {
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0e9fa',
    },
    infoLabel: {
        fontSize: 13,
        color: '#8a8a8a',
        marginBottom: 4,
    },
    infoValue: {
        fontSize: 15,
        color: '#333333',
        fontWeight: '600',
    },
})

export default ProfileForm
