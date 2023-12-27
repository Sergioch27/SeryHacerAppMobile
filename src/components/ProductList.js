import React, { useState, useEffect } from 'react';
import { SafeAreaView, Text } from "react-native";
import { GetProducts } from "../../service/wp_service";
import AsyncStorage from '@react-native-async-storage/async-storage';
import ProductsIds from "../../service/dataIds/ProductsIds.json";

const ProductsList  =  () => {
    const [productData, setProductData] = useState(null);

    useEffect(() => {
        const GetProductsIds = async () => {
            try {
                const mod_dev = await AsyncStorage.getItem('mod-dev');
                const environment = mod_dev === 'true' ? 'DEV' : 'PRO';
                const ids = ProductsIds.Data[environment][0].products[0].ids;
        
                const DataProducts = await GetProducts(ids);
                console.log(DataProducts);
                return DataProducts;
            }
            catch (err) {
                console.error('Error de inicio de sesión', err);
                throw err;
            }
        }
        GetProductsIds();
    }, [])

    return (
        <>
            <SafeAreaView>
                {productData && <Text>{productData.name}</Text>}
            </SafeAreaView>
        </>
    )
}


export default ProductsList;