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
                const environment = mod_dev === 'true' ? 'DEV' : 'PROD';
                const productArray = ProductsIds.Data[environment];
                if(Array.isArray(productArray) && productArray.length > 0) {
                    const ids = productArray.flatMap(entry => entry.products[0]?.id);
                    if(Array.isArray(ids) && ids.length > 0) {
                        const promises = ids.map(async (id) => {
                            return await GetProducts(id);
                        }
                        );
                        const products = await Promise.all(promises);
                        const mergedProducts =  products.reduce((acc, product, index) => {
                            acc[ids[index]] = product;
                            return acc;
                    }, {});
                        setProductData(mergedProducts);
                    } else {
                        console.error('No hay ids de productos');
                    }
                }
            }
            catch (err) {
                console.error('Error al listar productos', err);
                throw err;
            }
        }
        GetProductsIds();
    }, [])
    return (
        <>
            <SafeAreaView>
            {productData && Object.keys(productData).map((id) => (
    <Text key={id}>
        {`ID: ${id}, Nombre: ${productData[id]?.name}, Precio: ${productData[id]?.price}`}
    </Text>
))}
            </SafeAreaView>
        </>
    )
}


export default ProductsList;