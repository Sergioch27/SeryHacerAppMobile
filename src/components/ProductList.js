import React, {useEffect, useState } from 'react';
import { Pressable, SafeAreaView, Text, View, StyleSheet, Image, FlatList} from "react-native";
import { GetProducts} from "../../service/wp_service";
import AsyncStorage from '@react-native-async-storage/async-storage';
import ProductsIds from "../../service/dataIds/ProductsIds.json";
import Loading from '../components/smart_components/Loading';
import  Header  from '../components/smart_components/Header';
import { useNavigation } from '@react-navigation/native';

const ProductsList  =  () => {
    const [productData, setProductData] = useState([]);
    const [loading, setLoading] = useState(false);
    const navigation = useNavigation();
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
              <Header />
                <View style={styles.contentList}>
                {LoadView()}
                <FlatList
                    data={productData}
                    keyExtractor={item => item.id}
                    
                    renderItem={({ item }) => (
              <Pressable onPress={() => navigation.navigate('ProductDetailsView', { productItem: item})} style={styles.card}>
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
});


export default ProductsList;