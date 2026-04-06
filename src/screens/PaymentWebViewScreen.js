import React from 'react';
import { SafeAreaView } from 'react-native';
import PaymentWebView from '../components/PaymentWebView';

const PaymentWebViewScreen = () => (
  <SafeAreaView style={{ flex: 1 }}>
    <PaymentWebView />
  </SafeAreaView>
);

export default PaymentWebViewScreen;
