import React, {useEffect, useState } from 'react';
import { Pressable, SafeAreaView, Text, View, StyleSheet, Image, FlatList} from "react-native";
import { GetProducts, GetProductsParent} from "../../service/wp_service";
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
                if (Array.isArray(productData) && productData.length > 0) {
                  let parentIds = [];
                  productData.forEach((product) => {
                    if (Array.isArray(product) && product.length > 0) {
                      parentIds.push(product[0].parent_id);
                    }
                  });
                  console.log('parentIds', parentIds);
                  const parentProducts = await GetProductsParent(parentIds);
                  console.log('parentProducts', parentProducts);
                  if(Array.isArray(parentProducts) && parentProducts.length > 0) {
                    productData.forEach((product, index) => {
                      if (Array.isArray(product) && product.length > 0) {
                        productData[index][0].parent_data = parentProducts.find((parent) => parent.id === product[0].parent_id);
                      }
                    });
                  }
                }
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

    const GetProductsImage = (product) => {
      if (Array.isArray(product) && product.length > 0) {
        return product[0].image.src;
      } else if(product && product.images && product.images.length > 0){
        return product.images[0].src;
      }
     }
      const GetProductsName = (product) => {
        if(Array.isArray(product) && product.length > 0) {
          return product[0].parent_data.name
        } else if (product){
          return product.name
        }
      }
      const GetProductsPrice = (product) => {
        if(Array.isArray(product) && product.length > 0) {
          return product[0].parent_data.price
        } else if (product){
          return product.regular_price
        }
      }
      const getProductsId = (product) => {
        if(Array.isArray(product) && product.length > 0) {
          product.forEach(element => {
            return element.id
          });
        } else if (product){
          return product.id
        }
      }

    const ProductCard = ({ id, name, image, price  }) => {
        return (
          <View key={id} style={styles.cardContent}>
            <View>
              <Image style={styles.imageProduct} source={{ uri: image }} />
            </View>
            <View>
              <Text style={styles.text}>
                {name}
              </Text>
              <Text style={styles.priceText}>{price}</Text>
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
                    keyExtractor={item => getProductsId(item)}
                    renderItem={({ item }) => (
              <Pressable onPress={() => navigation.navigate('ProductDetailsView', { productItem: item})} style={styles.card}>
                    <ProductCard id={item.id} name={GetProductsName(item)} image={GetProductsImage(item)} price={GetProductsPrice(item)} />
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