import Navigator from "./Navigation/Navigator"
import React from 'react';
import ProductsList from "./src/components/ProductList";
import store from './src/app/store'
import { Provider } from 'react-redux'
import { SafeAreaProvider } from 'react-native-safe-area-context';
import CartSessionManager from "./src/components/CartSessionManager";

export default function App() {
  return (
    <>
    <SafeAreaProvider>
      <Provider store={store}>
          <CartSessionManager />
          <Navigator/>
            {/* <ProductsList /> */}
      </Provider>
    </SafeAreaProvider>
    </>
  );
}
