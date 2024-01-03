import { StyleSheet, View } from 'react-native'
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
        </View>
    )
}

export default ProductDetails

const styles = StyleSheet.create({})