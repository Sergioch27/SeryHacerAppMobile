import { StyleSheet, Text, SafeAreaView } from 'react-native'
import React from 'react'
import OrderList from '../components/OrderList'

const OrderView = () => {
  return (
    <SafeAreaView>
      <OrderList />
    </SafeAreaView>
  )
}

export default OrderView

const styles = StyleSheet.create({})