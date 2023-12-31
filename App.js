import Navigator from "./Navigation/Navigator"
import React from 'react';
import ProductsList from "./src/components/ProductList";
import store from './src/app/store'
import { Provider } from 'react-redux'

export default function App() {
  return (
    <>
    <Provider store={store}>
        <Navigator/>
          {/* <ProductsList /> */}
    </Provider>
    </>
  );
}