import { View, FlatList, StyleSheet, Text, Pressable, Image } from 'react-native'
import React, {useState, useEffect, useCallback } from 'react'
import { useFocusEffect } from '@react-navigation/native';
import { GetOder } from '../../service/wp_service'
import Loading from './smart_components/Loading'
import { AntDesign } from '@expo/vector-icons';

const OrderList = () => {
    const [orderData, setOrderData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const images = [
        { logo: require('../../assets/logotipo.png') },
        { background: require('../../assets/SALA-DE-ESPERA.jpg') },
      ];

      useEffect(() => {
        const GetOderUser = async () => {
          try {
            if (page === 1) {
              setLoading(true);
            }
            const Data = await GetOder(page);
            setOrderData([...orderData, ...Data]);
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

    useFocusEffect(
      useCallback(() => {
        setPage(1);
        setOrderData([]);
      }, [])
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
      const LoadViewList = () => {
          return (
            <>
                <View style={styles.load}>
                    <Loading />
                </View>
            </>
          )
      }

      const OrderCard = ({ id, date_created, status }) => {
        return (
          <View key={id} style={styles.cardContent}>
            <View>
              <Text>{date_created}</Text>
            </View>
            <View>
              <Text style={styles.text}>
                {status}
              </Text>
            </View>
          </View>
        );
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
        <View style={styles.ContentList}>
        {LoadView()}
        <FlatList
            data={orderData}
            renderItem={({ item }) => (
              <Pressable>
                <OrderCard id={item.id} status={item.status} date_created={item.date_created}/>
              </Pressable>
            )}
            keyExtractor={(item) => item.id.toString()}
            ListFooterComponent={page !== 1 ? LoadViewList(): null}
            onEndReached={loadMoreOrders}
            onEndReachedThreshold={0}
        />
        </View>
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
          cardContent:{
            marginLeft: 30,
            marginRight: 30,
            marginTop: 20,
            padding: 10,
            borderWidth: 2,
            borderRadius:10,
            shadowColor: "#000000",
          },
          ContentList:{
            backgroundColor: 'transparent',
            height: 640,
          },
          load:{
            marginTop: 20,
          },
})
export default OrderList