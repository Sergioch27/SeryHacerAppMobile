import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import Swiper from 'react-native-swiper';
import { format, addDays, addHours } from 'date-fns';

const Calendar = () => {
  const startDate = new Date(2024, 0, 1); // 1st January 2024
  const endDate = new Date(2025, 11, 31); // 31st December 2025

  const generateDays = () => {
    const days = [];
    let currentDate = startDate;

    while (currentDate <= endDate) {
      days.push(currentDate);
      currentDate = addDays(currentDate, 1);
    }

    return days;
  };

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

  const renderDays = () => {
    const days = generateDays();
    return days.map((day, index) => (
      <View key={index} style={styles.dayContainer}>
        <Text>{format(day, 'EEEE, MMM d')}</Text>
        {renderHours()}
      </View>
    ));
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
});

export default Calendar;
