import React, { useEffect, useState } from 'react';
import { Pressable, SafeAreaView, Text, View, StyleSheet, Image, FlatList } from "react-native";
import { GetProducts, GetProductsParent } from "../../service/wp_service";
import AsyncStorage from '@react-native-async-storage/async-storage';
import ProductsIds from "../../service/dataIds/ProductsIds.json";
import Loading from '../components/smart_components/Loading';
import  Header  from '../components/smart_components/Header';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { AntDesign } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ProductsList = () => {
    const [productData, setProductData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const navigation = useNavigation();
    const cartItems = useSelector((state) => state.cart.items);
    const insets = useSafeAreaInsets();

    const LoadView = () => {
      if (loading) {
        return (
          <View style={styles.loading}>
            <Loading />
          </View>
        );
      }

      return null;
    };

    const getPrimaryProduct = (product) => {
      if (Array.isArray(product) && product.length > 0) {
        return product[0];
      }

      return product;
    };
    
    const loadProducts = async (isRefresh = false) => {
            try {
                if (isRefresh) {
                  setRefreshing(true);
                } else {
                  setLoading(true);
                }
                setErrorMessage('');
                const mod_dev = await AsyncStorage.getItem('mod-dev');
                const environment = mod_dev === 'true' ? 'DEV' : 'PROD';
                const productArray = ProductsIds.Data[environment];
                console.log('[ProductList] ambiente:', environment, 'ids:', productArray);

                const productsResponse = await GetProducts(productArray);
                const normalizedProducts = Array.isArray(productsResponse)
                    ? productsResponse.filter((product) => {
                        if (Array.isArray(product)) {
                            return product.length > 0;
                        }

                        return Boolean(product?.id);
                    })
                    : [];

                if (normalizedProducts.length > 0) {
                    const parentIds = [];

                    normalizedProducts.forEach((product) => {
                        if (Array.isArray(product) && product.length > 0 && product[0]?.parent_id) {
                            parentIds.push(product[0].parent_id);
                        }
                    });

                    console.log('[ProductList] parentIds:', parentIds);

                    if (parentIds.length > 0) {
                        const parentProducts = await GetProductsParent([...new Set(parentIds)]);
                        console.log('[ProductList] parentProducts:', parentProducts);

                        if (Array.isArray(parentProducts) && parentProducts.length > 0) {
                            normalizedProducts.forEach((product, index) => {
                                if (Array.isArray(product) && product.length > 0) {
                                    normalizedProducts[index][0].parent_data = parentProducts.find((parent) => parent.id === product[0].parent_id);
                                }
                            });
                        }
                    }
                }

                setProductData(normalizedProducts);
                console.log('[ProductList] productos renderizables:', normalizedProducts);
            }
            catch (err) {
                console.error('Error al listar productos', err);
                setErrorMessage('No se pudieron cargar los productos. Intenta nuevamente.');
            }
            finally {
                setLoading(false);
                setRefreshing(false);
            }
        };

    useEffect(() => {
        loadProducts();
    }, []);


    const GetProductsImage = (product) => {
      const primaryProduct = getPrimaryProduct(product);

      if (primaryProduct?.image?.src) {
        return primaryProduct.image.src;
      }

      if (primaryProduct?.parent_data?.images?.length > 0) {
        return primaryProduct.parent_data.images[0].src;
      }

      if (primaryProduct?.images?.length > 0) {
        return primaryProduct.images[0].src;
      }

      return null;
    };

    const GetProductsName = (product) => {
      const primaryProduct = getPrimaryProduct(product);

      if (primaryProduct?.parent_data?.name) {
        return primaryProduct.parent_data.name;
      }

      return primaryProduct?.name ?? '';
    };

    const GetProductsPrice = (product) => {
      const primaryProduct = getPrimaryProduct(product);

      if (primaryProduct?.parent_data?.price) {
        return primaryProduct.parent_data.price;
      }

      if (primaryProduct?.parent_data?.regular_price) {
        return primaryProduct.parent_data.regular_price;
      }

      return primaryProduct?.regular_price ?? primaryProduct?.price ?? '';
    };

    const getProductsId = (product, index) => {
      const primaryProduct = getPrimaryProduct(product);

      if (primaryProduct?.id) {
        return primaryProduct.id.toString();
      }

      return `product-${index}`;
    };

    const ProductCard = ({ name, image, price }) => {
        return (
          <View style={styles.cardContent}>
            <View>
              {image ? <Image style={styles.imageProduct} source={{ uri: image }} /> : null}
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
            <SafeAreaView style={styles.safeArea}>
              <Header />
                <View style={styles.contentList}>
                {LoadView()}
                <FlatList
                    data={productData}
                    keyExtractor={(item, index) => getProductsId(item, index)}
                    renderItem={({ item, index }) => {
                      console.log('[ProductList] render item:', index, getProductsId(item, index), GetProductsName(item));

                      return (
              <Pressable onPress={() => navigation.navigate('ProductDetailsView', { productItem: item})} style={styles.card}>
                    <ProductCard name={GetProductsName(item)} image={GetProductsImage(item)} price={GetProductsPrice(item)} />
              </Pressable>
            )}}
            contentContainerStyle={styles.listContent}
            onRefresh={() => loadProducts(true)}
            refreshing={refreshing}
            ListEmptyComponent={!loading ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>{errorMessage || 'No hay productos para mostrar.'}</Text>
                {errorMessage ? (
                  <Pressable style={styles.retryButton} onPress={() => loadProducts(true)}>
                    <Text style={styles.retryButtonText}>Reintentar</Text>
                  </Pressable>
                ) : null}
              </View>
            ) : null}
            />
                {cartItems.length > 0 ? (
                  <Pressable
                    onPress={() => navigation.navigate('CartView')}
                    style={[styles.floatingCartButton, { bottom: insets.bottom + 96 }]}
                  >
                    <AntDesign name="shoppingcart" size={26} color="#ffffff" />
                    <View style={styles.cartBadge}>
                      <Text style={styles.cartBadgeText}>{cartItems.length}</Text>
                    </View>
                  </Pressable>
                ) : null}
                </View>
            </SafeAreaView>
        </>
    )
}
const styles = StyleSheet.create({
      safeArea: {
        flex: 1,
      },
      contentList: {
        backgroundColor: 'transparent',
        flex: 1,
      },
      listContent: {
        flexGrow: 1,
        paddingBottom: 120,
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
        backgroundColor: '#ffffff',
      },
        imageProduct:{
            width:'100%',
            height:300,
            alignSelf: 'center',
        },
        loading:{
            marginTop: 200,
        },
        emptyText: {
            marginTop: 40,
            textAlign: 'center',
            fontSize: 16,
        },
        emptyContainer: {
            marginTop: 40,
            alignItems: 'center',
            paddingHorizontal: 24,
        },
        card: {
            marginBottom: 10,
        },
        retryButton: {
            marginTop: 16,
            backgroundColor: '#A168DE',
            borderRadius: 10,
            paddingVertical: 10,
            paddingHorizontal: 18,
        },
        retryButtonText: {
            color: '#ffffff',
            fontWeight: '700',
        },
        floatingCartButton: {
            position: 'absolute',
            right: 22,
            width: 58,
            height: 58,
            borderRadius: 29,
            backgroundColor: '#A168DE',
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#000000',
            shadowOpacity: 0.2,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 4 },
            elevation: 6,
        },
        cartBadge: {
            position: 'absolute',
            top: -4,
            right: -2,
            minWidth: 22,
            height: 22,
            borderRadius: 11,
            paddingHorizontal: 5,
            backgroundColor: '#ff6b35',
            alignItems: 'center',
            justifyContent: 'center',
        },
        cartBadgeText: {
            color: '#ffffff',
            fontSize: 11,
            fontWeight: '700',
        },
});


export default ProductsList;
