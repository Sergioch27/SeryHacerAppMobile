import { SafeAreaView } from "react-native";
import ProductsList from "../components/ProductList";



const ProductView = ()=>{

    return (
        <>
            <SafeAreaView style={{ flex: 1 }}>
                <ProductsList/>
            </SafeAreaView>
        </>
    )
}
export default ProductView
