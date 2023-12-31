import { View, FlatList, StyleSheet, Text, Pressable, Image } from 'react-native'
import React, {useState, useCallback } from 'react'
import { GetOder } from '../../service/wp_service'
import Loading from './smart_components/Loading'
import { useFocusEffect } from '@react-navigation/native'
import { AntDesign } from '@expo/vector-icons';

const OrderList = () => {
    const [orderData, setOrderData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const images = [
        { logo: require('../../assets/logotipo.png') },
        { background: require('../../assets/SALA-DE-ESPERA.jpg') },
      ];

      useFocusEffect(
        useCallback(() => {
          const GetOderUser = async () => {
            try {
              setLoading(true);
              const Data = await GetOder(page);
              setOrderData(Data);
              console.log('Ordenes', Data);
            } catch (err) {
              console.error('Error al listar ordenes', err);
              throw err;
            } finally {
              setLoading(false);
            }
          };
    
          GetOderUser();
        }, [page]) 
      );
    const LoadView = () => {
        if (loading){

          return (
            <>
                <View style={styles.loading}>
                    <Loading />
                </View>
            </>
          )
        }
      }
      const loadMoreOrders = () => {
        setPage(page + 1);
      }
      const LoginOut = async () => {
        const navigation = useNavigation();
        try {
          const logout =  await LoginOutUser();
          if (logout === true)
          {
            console.log(await AsyncStorage.getItem('user_token'));
            navigation.navigate('Shoptab');
            }
        } catch (err) {
          console.error('Error de cierre de sesión', err);
          throw err;
        }
      };
  
  return (
    <View>
       <View style={styles.contentImage} >
            <Pressable onPress={LoginOut}>
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
        {LoadView()}
        <FlatList
            data={orderData}
            renderItem={({ item }) => ( 
                <View>
                    <Text>{item.id}</Text>
                    <Text>{item.date_created}</Text>
                    <Text>{item.status}</Text>
                </View>
            
            )}
            keyExtractor={(item) => item.id.toString()}
            // ListFooterComponent={<Loading />}
            // onEndReached={loadMoreOrders}
        />
    </View>
  )
}
const styles = StyleSheet.create({
    loading:{
        marginTop: 200,
    },
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
          textIcon:{
            marginTop: 5,
            fontSize: 10,
            fontWeight: '500',
            color: '#A168DE',
          },
          LoginOutUser:{
            width: 50,
            alignItems: "center",
            alignSelf: 'flex-end',
            marginLeft: 320,
            bottom: 30,
          },
  
    
})
export default OrderList