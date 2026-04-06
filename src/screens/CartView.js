import React from 'react';
import { SafeAreaView } from 'react-native';
import CartDetails from '../components/CartDetailsCheckout';

const CartView = () => {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <CartDetails />
    </SafeAreaView>
  );
};

export default CartView;
