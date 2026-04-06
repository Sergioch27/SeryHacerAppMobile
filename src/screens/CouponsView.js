import React from 'react';
import { SafeAreaView } from 'react-native';
import CouponsList from '../components/CouponsList';

const CouponsView = () => (
  <SafeAreaView style={{ flex: 1 }}>
    <CouponsList />
  </SafeAreaView>
);

export default CouponsView;
