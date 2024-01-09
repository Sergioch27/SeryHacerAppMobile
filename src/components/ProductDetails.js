import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, Pressable } from 'react-native';
import { format, addHours, startOfMonth, lastDayOfMonth, eachDayOfInterval } from 'date-fns';

const Calendar = () => {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const years= [2024,2025];
  const months = [
    { label: 'Enero', value: 0 },
    { label: 'Febrero', value: 1 },
    { label: 'Marzo', value: 2 },
    { label: 'Abril', value: 3 },
    { label: 'Mayo', value: 4 },
    { label: 'Junio', value: 5 },
    { label: 'Julio', value: 6 },
    { label: 'Agosto', value: 7 },
    { label: 'Septiembre', value: 8 },
    { label: 'Octubre', value: 9 },
    { label: 'Noviembre', value: 11 },
    { label: 'Diciembre', value: 11 },
  ];

  const [selectYear, setSelectYear] = useState(currentYear);
  const [selectMonth, setSelectMonth] = useState(currentMonth);

  const generateUniqueId = () => {
    return '_' + Math.random().toString(36);
  };

  const generateDays = () => {
      const startOfMonthDate = startOfMonth(new Date(selectYear,selectMonth,1));
      const  endOfMonthDate = lastDayOfMonth(new Date(selectYear,selectMonth,1));
      const days = eachDayOfInterval({
        start: startOfMonthDate,
        end: endOfMonthDate
      })
      return days.map((day)=>({
        id:generateUniqueId(),
        date: day
      }));
  };
useEffect(()=>{
  renderDays()
},[selectMonth])

  const generateHours = () => {
    const startHour = 8;
    const endHour = 22;
    const interval = 1;
    const hours = [];

    for (let hour = startHour; hour <= endHour; hour += interval) {
      hours.push(hour);
    }
    return hours;
  };

  const renderItemDays = ({ item }) => (
    <Pressable onPress={() => console.log('DIA presionado')} style={styles.card}>
      <Text style={styles.dayNumber}>{format(item.date, 'd')}</Text>
      <Text style={styles.dayName}>{format(item.date, 'EEEE')}</Text>
    </Pressable>
  );

  const renderDays = () => {
    const days = generateDays();
    console.log(days)
  return (
    <FlatList
        data={days}
        horizontal={true}
        keyExtractor={(item) => item.id}
        renderItem={renderItemDays}
    />
  )
  };

  const renderHours = () => {
    const hours = generateHours();
    return hours.map((hour, index) => (
      <View key={index} style={styles.hourContainer}>
        <Text>{format(addHours(new Date(), hour), 'HH'+ ':00')}</Text>
      </View>
    ));
  };

  return (
<SafeAreaView>
    <View>
      <FlatList
        data={years}
        horizontal={true}
        keyExtractor={(item)=>item.toString()}
        renderItem={({item}) => (
            <Pressable onPress={() => {console.log('A Selecionado', selectYear); setSelectYear(item)}} style={styles.yearContainer}>
                <Text>
                  {item}
                </Text>
              </Pressable>
        )}
      />
    </View>
    <View>
      <FlatList
        data={months}
        horizontal={true}
        keyExtractor={(item)=>item.value.toString()}
        renderItem={({item}) =>(
            <Pressable onPress={() => {
              console.log('MES Selecionado', selectMonth);
              setSelectMonth(item.value)
            }}
            style={styles.card} >
              <Text>
                {item.label}
              </Text>
            </Pressable>
        )}
      />
    </View>
      {renderDays()}
</SafeAreaView>
  );
};

const styles = StyleSheet.create({
  dayContainer: {
    color:'#000000',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  hourContainer: {
    color:'#000000',
    borderBottomWidth: 2,
    borderBottomColor: '#000000',
  },
  card: {
    padding: 10,
    margin: 5,
    borderRadius: 8,
    backgroundColor: '#e0e0e0',
    alignItems: 'center',
  },
  dayNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  dayName: {
    fontSize: 14,
  },
  yearContainer: {
    padding: 20,
    margin: 5,
    borderRadius: 8,
    backgroundColor: '#e0e0e0',
    alignItems: 'center',
  },
});

export default Calendar;
