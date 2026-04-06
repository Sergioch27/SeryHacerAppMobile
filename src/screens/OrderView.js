import { StyleSheet, Text, SafeAreaView } from 'react-native'
import React from 'react'
import OrderList from '../components/OrderListEnhanced'

const OrderView = () => {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <OrderList />
    </SafeAreaView>
  )
}

export default OrderView

const styles = StyleSheet.create({})
