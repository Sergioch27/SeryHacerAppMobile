import { StyleSheet, View, Text } from 'react-native'
import React, { useEffect } from 'react'
import Calendar from '../../class/Calendar'

const ProductDetails = () => {
        useEffect(() => {

                const getCalendar = new Calendar();
                const calendarData = getCalendar.CreateCalendar();
                console.log('calendar', calendarData);
        }, [])

    return (
        <View>
            <Text>ProductDetails</Text>
        </View>
    )
}

export default ProductDetails

const styles = StyleSheet.create({})