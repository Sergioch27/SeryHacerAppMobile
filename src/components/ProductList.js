import React, {useEffect, useState } from 'react';
import { Pressable, SafeAreaView, Text, View, StyleSheet, Image, FlatList} from "react-native";
import { GetProducts, LoginOutUser } from "../../service/wp_service";
import AsyncStorage from '@react-native-async-storage/async-storage';
import ProductsIds from "../../service/dataIds/ProductsIds.json";
import Loading from '../components/smart_components/Loading';
import { AntDesign } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const ProductsList  =  () => {
    const [productData, setProductData] = useState([]);
    const [loading, setLoading] = useState(false);

    const images = [
        { logo: require('../../assets/logotipo.png') },
        { background: require('../../assets/SALA-DE-ESPERA.jpg') },
      ];
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
    
    useEffect(() => {
        const GetProductsIds = async () => {
            try {
              setLoading(true);
                const mod_dev = await AsyncStorage.getItem('mod-dev');
                const environment = mod_dev === 'true' ? 'DEV' : 'PROD';
                const productArray = ProductsIds.Data[environment];
                // const productArray = ProductsIds.Data['DEV']; //solo para pruebas, SE DEBE BORRAR AL TERMINAR
                const productData = await GetProducts(productArray);
                setProductData(productData);
                console.log('Productos', productData);
                }
            catch (err) {
                console.error('Error al listar productos', err);
                throw err;
            }
            finally {
                setLoading(false);
            }
        }
        GetProductsIds();
    }, [])

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

    const ProductCard = ({ id, name, image }) => {
        return (
          <View key={id} style={styles.cardContent}>
            <View>
              <Image style={styles.imageProduct} source={{ uri: image }} />
            </View>
            <View>
              <Text style={styles.text}>
                {name}
              </Text>
            </View>
          </View>
        );
      };
          return (
        <>
            <SafeAreaView>
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
            {/* <View style={styles.contentText}>
                <Text style={styles.text}>
                    RESERVA DE BOX
                </Text>
              </View> */}
                <View style={styles.contentList}>
                {LoadView()}
                <FlatList
                    data={productData}
                    keyExtractor={item => item.id}
                    // navigation.navigate('ProductDetail', {item})
                    renderItem={({ item }) => (
              <Pressable onPress={() => console.log('FUNCIONO')} style={styles.card}>
                <ProductCard id={item.id} name={item.name} image={item.images[0]?.src} />
              </Pressable>
            )}
            initialScrollIndex={0}
            />
                </View>
            </SafeAreaView>
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
      contentList: {
        backgroundColor: 'transparent',
        height: 658,

      },
      contentText:{
        justifyContent: "center",
        alignItems: "center",
      },
      text:{
        marginTop: 50,
        fontSize: 20,
        fontWeight: '500',
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
        imageProduct:{
            width:'100%',
            height:300,
            alignSelf: 'center',
        },
        loading:{
            marginTop: 200,
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
});


export default ProductsList;