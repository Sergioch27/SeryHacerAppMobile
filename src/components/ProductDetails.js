import { StyleSheet, View, Text } from 'react-native'
import React, { useEffect, useState } from 'react'
import Calendar from '../../class/Calendar'

const ProductDetails = () => {
    const [calendarData, setCalendarData] = useState([]);

useEffect(() => {
    const calendar = ()=>{
        const calendar = new Calendar();
        const calendarData = calendar.CreateCalendar();
        setCalendarData(calendarData);
        console.log(calendarData);
    }
    calendar();
}, [])

const CalendarView = () => {
    return (
        <View>
        {calendarData.map((yearObject) => (
          <View key={Object.keys(yearObject)[0]}>
            <Text>Año: {Object.keys(yearObject)[0]}</Text>
            {Array.isArray(Object.values(yearObject)[0]) && Object.values(yearObject)[0].map((monthArray, monthIndex) => (
              <View key={monthIndex + 1}>
                <Text>Mes: {monthIndex + 1}</Text>
                {Array.isArray(monthArray) && monthArray.map((dayObject, dayIndex) => (
                  <TouchableOpacity key={dayIndex} onPress={() => handleDayClick(dayObject)}>
                    <View>
                      <Text>Día: {dayObject.day}</Text>
                      <Text>Horas y Eventos:</Text>
                      {Array.isArray(dayObject.hours) && dayObject.hours.map((hourObject, hourIndex) => (
                        <View key={hourIndex}>
                          <Text>Hora: {hourObject.hour}</Text>
                          <Text>Eventos: {Array.isArray(hourObject.events) ? hourObject.events.length : 0}</Text>
                        </View>
                      ))}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ))}
          </View>
        ))}
      </View>
)
}

    return (
        <View>
            <Text>ProductDetails</Text>
            <CalendarView />
        </View>
    )
}

export default ProductDetails

const styles = StyleSheet.create({})