import React from 'react';
import { SafeAreaView } from 'react-native';
import OrderDetails from '../components/OrderDetails';

const OrderDetailsView = () => {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <OrderDetails />
    </SafeAreaView>
  );
};

export default OrderDetailsView;
