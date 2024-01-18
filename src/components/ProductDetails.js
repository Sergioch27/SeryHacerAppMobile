import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, Pressable, ImageBackground} from 'react-native';
import { format, addHours, startOfMonth, lastDayOfMonth, eachDayOfInterval, isSameDay} from 'date-fns';
import { useRoute } from '@react-navigation/native';
import { AntDesign } from '@expo/vector-icons';
import Loading from "./smart_components/Loading";
import { useNavigation } from '@react-navigation/native';


const Calendar = () => {
  const route = useRoute();
  const { productItem } = route.params
  const   navigation = useNavigation();
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
    { label: 'Noviembre', value: 10 },
    { label: 'Diciembre', value: 11 },
  ];
  const dayTranslations = {
    Mon: 'Lun',
    Tue: 'Mar',
    Wed: 'Mié',
    Thu: 'Jue',
    Fri: 'Vie',
    Sat: 'Sáb',
    Sun: 'Dom',
  };
  const [selectYear, setSelectYear] = useState(currentYear);
  const [selectMonth, setSelectMonth] = useState(currentMonth);
  const [currentDay, setCurrentDay] = useState(new Date());
  const [selectDay, setSelectDay] = useState('');
  const [days, setDays] = useState([]);
  const [imageLoading, setImageLoading] = useState(true);
  
  const handleImageLoad = () => {
    setImageLoading(false);
  }
const image = { uri: productItem.images[0].src };

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
        date: day,
        isCurrentDay: isSameDay(day, currentDay),
      }));
  };
useEffect(()=>{
  setDays(generateDays());
},[selectMonth,selectYear,currentDay])

const generateHours = () => {
  const hours = [];
  for (let i = 7; i < 22; i++) {
    hours.push({ startHour: i, endHour: i + 1 });
  }

  return hours;
};  const setSelectDayAndCurrentDay = (selectedDate) => {
    if (!isSameDay(selectedDate, currentDay)) {

      setSelectDay(selectedDate);
    }
    setCurrentDay(selectedDate);
  };

  const renderItemDays = ({ item }) => (
    <Pressable onPress={() => setSelectDayAndCurrentDay(item.date)} style={[styles.card, item.date && item.date.getDay() === 0 && styles.disabledDay, (isSameDay(selectDay, item.date) || isSameDay(currentDay, item.date)) && styles.containerSelected,
    item.isCurrentDay && styles.containerSelected
    ]}
    disabled={!item.date}>
      <Text style={styles.dayNumber}>{format(item.date, 'd')}</Text>
      <Text style={[styles.dayName, item.date && item.date.getDay() === 0 && styles.disabledText]}>{item.date ? dayTranslations[format(item.date, 'EEE')] : ''}</Text>
    </Pressable>
  );

  const flatListRef = useRef(null);

  useEffect(() => {
    const currentDayIndex = days.findIndex(day => isSameDay(day.date, currentDay));

    if (currentDayIndex !== -1 && flatListRef.current) {
      flatListRef.current.scrollToIndex({
        index: currentDayIndex,
        animated: true,
        viewPosition: 0.5,
      });
    }
  }, [days, currentDay]);

  const getItemLayout = (_, index) => ({
    length: 50,
    offset: 70 * index,
    index,
  });

  const renderDays = () => {
    const days = generateDays();
    console.log(days)
  return (
    <FlatList
        ref={flatListRef}
        data={days}
        horizontal={true}
        keyExtractor={(item) => item.id}
        renderItem={renderItemDays}
        getItemLayout={getItemLayout}
    />
  )
  };

  const renderHours = () => {
    const hours = generateHours();
    return (
      <View>
          <FlatList
            data={hours}
            numColumns={2}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => (
              <View style={styles.hourContainer}>
                <Text style={styles.cardHour}>
                  {`${format(addHours(new Date(), item.startHour), 'HH' + ':00')} - ${format(addHours(new Date(), item.endHour), 'HH' + ':00')}`}
                </Text>
              </View>
            )}
          />
      </View>
    );
  };
  
    navigation.setOptions({
    headerTransparent: true,
    headerLeft: ()=>(
        <Pressable   style={{ marginRight: '20%' }} onPress={()=>navigation.goBack()}>
            <AntDesign name="leftcircle" size={30} color="black" />
        </Pressable>
    ),
    headerTitle: productItem.name,
    headerTitleStyle: {
      color: '#ffffff',
      fontSize: 25,
    }
  });
  return (
<SafeAreaView>
    <View style={styles.ZoneImage}>
    {
      imageLoading && <Loading style={styles.load}/>
    }
      <ImageBackground source={image} resizeMode="cover" style={styles.backgroundProduct} onLoad={handleImageLoad}>
      </ImageBackground>
    </View>
    <View style={styles.ZoneCalendar}>
        <View style={styles.YearZoneSelector}>
          <FlatList
            data={years}
            horizontal={true}
            keyExtractor={(item)=>item.toString()}
            renderItem={({item}) => (
              <>
                <Pressable onPress={() => {console.log('A Selecionado', selectYear); setSelectYear(item)}} style={[styles.yearContainer, selectYear === item && styles.containerSelected]}>
                    <Text>
                      {item}
                    </Text>
                  </Pressable>
              </>
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
                style={[styles.card, selectMonth === item.value && styles.containerSelected]} >
                  <Text>
                    {item.label}
                  </Text>
                </Pressable>
            )}
          />
        </View>
          {renderDays()}
          {renderHours()}
    </View>
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
  load: {
    marginTop: 100,
  },
  hourContainer: {
    flexDirection: 'column',
    width: 150,
    padding: 20,
    margin: 5,
    borderRadius: 8,
    backgroundColor: '#e0e0e0',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 20,
},
cardHour:{
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  card: {
    padding: 20,
    margin: 5,
    borderRadius: 8,
    backgroundColor: '#e0e0e0',
    alignItems: 'center',
  },
  disabledDay: {
    backgroundColor: '#ccc', 
  },
  disabledText: {
    color: '#888',
  },
  dayNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  dayName: {
    fontSize: 14,
  },
  YearZoneSelector: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  yearContainer: {
    padding: 20,
    margin: 5,
    borderRadius: 8,
    backgroundColor: '#e0e0e0',
    alignItems: 'center',
  },
containerSelected: {
    padding: 20,
    margin: 5,
    borderRadius: 8,
    backgroundColor: '#A168DE',
    alignItems: 'center',
  },
  backgroundProduct: {
    width: '100%',
    height: '100%',
  },
  ZoneImage: {
    borderBottomLeftRadius: 50,
    borderBottomRightRadius: 50,
    height: 300,
    backgroundColor: '#ffffff',
    overflow: 'hidden'
  },
  ZoneCalendar: {
    backgroundColor: '#fff',
    marginTop: -50,
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
    padding: 20,
  },
});

export default Calendar;
