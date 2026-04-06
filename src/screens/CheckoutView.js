import React from 'react';
import { SafeAreaView } from 'react-native';
import CheckoutForm from '../components/CheckoutFormIntegrated';

const CheckoutView = () => {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <CheckoutForm />
    </SafeAreaView>
  );
};

export default CheckoutView;
