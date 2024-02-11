import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, Pressable, ImageBackground} from 'react-native';
import { format, startOfMonth, lastDayOfMonth, eachDayOfInterval, isSameDay, eachHourOfInterval, set} from 'date-fns';
import { useRoute } from '@react-navigation/native';
import { AntDesign } from '@expo/vector-icons';
import Loading from "./smart_components/Loading";
import { useNavigation } from '@react-navigation/native';
import { GetHours } from '../../service/wp_service';


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
  const [fechasSeleccionadas, setFechasSeleccionadas] = useState([]);
  const [hasExecuted, setHasExecuted] = useState(false);
  const [bookedHours, setBookedHours] = useState([{}]);
  const [loading, setLoading] = useState(false);



  const imgSrc = ()=>{
    if (Array.isArray(productItem) && productItem.length > 0) {
      return productItem[0].image.src ;
    } else if (productItem && productItem.images && productItem.images.length > 0) {
      return   productItem.images[0].src ;
    }
  }
const ProductName = ()  => {
  if(Array.isArray(productItem) && productItem.length > 0) {
    return productItem[0].parent_data.name;
  } else {
    return productItem.name;
  }
}
    const formBookingValue = [];
    if (Array.isArray(productItem) && productItem.length > 0) {
      productItem.forEach(element => {
        for (let i = 0; i < element.meta_data.length; i++) {
          if (element.meta_data[i].key === 'bookacti_variable_form') {
            formBookingValue.push(element.meta_data[i].value);
          }
        }
        if(element.parent_id === 12110 && formBookingValue.indexOf('6') === -1){
          formBookingValue.push('6');
        }
      });
    } else {
      formBookingValue.push(productItem.meta_data[2].value);
    }
    console.log('formBookingValue', formBookingValue);
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

useEffect(() => {
  const dateSelected = () => {
  setLoading(true);
  const horas = generateHours();
  const selectedDate = new Date(selectYear, selectMonth, currentDay ? currentDay.getDate() : selectDay.getDate());
  console.log('DIA: ', selectedDate);

  const fechasYHorasSeleccionadas = [
  {
      BookID: formBookingValue,
  }
  ];

  horas.forEach((hora) => {
    const fechaHoraSeleccionada = {
      año: selectedDate.getFullYear(),
      mes: selectedDate.getMonth() + 1,
      dia: selectedDate.getDate(),
      horaInicio: hora.startHour < 10 ? `0${hora.startHour}:00:00` : `${hora.startHour}:00:00`,
    };

    fechasYHorasSeleccionadas.push(`${fechaHoraSeleccionada.año}-${String(fechaHoraSeleccionada.mes).padStart(2, '0')}-${String(fechaHoraSeleccionada.dia).padStart(2, '0')} ${fechaHoraSeleccionada.horaInicio}`);
  });
  console.log('Fechas y Horas Seleccionadas:', fechasYHorasSeleccionadas);
  return fechasYHorasSeleccionadas;
  };
  if((selectDay || currentDay) && !hasExecuted) {
    const CheckHour = dateSelected();
    GetHours(CheckHour).then((res) => {
      const BookedEvent = res.map(item => ({
        ...item,
        event_start: item.fechaHora.split(' ')[1].slice(0, -6),
      }));

      console.log('Horas Disponibles:', BookedEvent);
      setBookedHours(BookedEvent);
      setLoading(false);
    });
    setHasExecuted(true);
  }
  if (selectDay) {
    setHasExecuted(false);
  }
}, [selectDay, currentDay, hasExecuted, selectMonth, selectYear]);

const generateHours = () => {
const hours = eachHourOfInterval({
    start: new Date(selectYear, selectMonth, 1, 8),
    end: new Date(selectYear, selectMonth, 1, 22),
})
return hours.map((hour)=>({
    id: generateUniqueId(),
    startHour: hour.getHours(),
    endHour: hour.getHours() + 1,
    date: selectDay || currentDay,
}))
};

const setSelectDayAndCurrentDay = (selectedDate) => {
  setBookedHours([{}]);
  setHasExecuted(false);
    if (!isSameDay(selectedDate, currentDay)) {

      setSelectDay(selectedDate);
    }
    setCurrentDay(selectedDate);
  };
// Funcion para renderizar un item de la lista de dias
  const renderItemDays = ({ item }) => (
    <Pressable onPress={() => {setSelectDayAndCurrentDay(item.date)}}
    style={[styles.card, item.date && item.date.getDay() === 0 && styles.disabledDay, (isSameDay(selectDay, item.date) || isSameDay(currentDay, item.date)) && styles.containerSelected,
    item.isCurrentDay && styles.containerSelected
    ]}
    disabled={!item.date}>
      <Text style={styles.dayNumber}>{format(item.date, 'd')}</Text>
      <Text style={[styles.dayName, item.date && item.date.getDay() === 0 && styles.disabledText]}>{item.date ? dayTranslations[format(item.date, 'EEE')] : ''}</Text>
    </Pressable>
  );

// Función para manejar el evento de presionar un item de la lista de horas
  const handlePress = (item) => {
    console.log('FUNCIONO', item.startHour, item.endHour, item.date);
      const fechaHoraSeleccionada = {
        año: item.date.getFullYear(),
        mes: item.date.getMonth() + 1,
        dia: item.date.getDate(),
        horaInicio: item.startHour < 10 ? `0${item.startHour}:00:00` : `${item.startHour}:00:00`,
        horaFin: item.endHour < 10 ? `0${item.endHour}:00:00` : `${item.endHour}:00:00`,
      };
      const fechaEncontrada = fechasSeleccionadas.find((fecha) => fecha.año === fechaHoraSeleccionada.año && fecha.mes === fechaHoraSeleccionada.mes && fecha.dia === fechaHoraSeleccionada.dia && fecha.horaInicio === fechaHoraSeleccionada.horaInicio);
        if (fechaEncontrada) {
          const nuevasFechas = fechasSeleccionadas.filter((fecha) => fecha !== fechaEncontrada);
          setFechasSeleccionadas(nuevasFechas);
          console.log('Fechas Seleccionadas:', nuevasFechas);
          return;
        }
        setFechasSeleccionadas([...fechasSeleccionadas, fechaHoraSeleccionada]);
        console.log('Fechas Seleccionadas:', [...fechasSeleccionadas, fechaHoraSeleccionada]);
        return fechasSeleccionadas;
  };

// Funcion para renderizar un item de la lista de horas
  const renderItemHour = ({ item }) => {
    const startHour = item.startHour < 10 ? `0${item.startHour}` : item.startHour;
    const isBooked = bookedHours.find(booking => booking.active === "1" && booking.event_start === `${item.startHour}`);
    const hourStyle = isBooked ? styles.inactiveHour : styles.activeHour;
    return (
  <Pressable onPress={() => handlePress(item)} disabled={bookedHours.active === "1"}>
      <View style={styles.hourContainer}>
        <Text style={[styles.cardHour, hourStyle ]}>
          {item.startHour}:00 - {item.endHour}:00
        </Text>
        {isBooked ?
            <View style={ styles.tagbookedContainer}>
              <Text style={[styles.tagbooked,styles.tagbookedText]}>Reservado</Text>
            </View>
            : <View style={ styles.tagbookedAvalibleContainer}>
            <Text style={[styles.tagAvaliblebooked,styles.tagbookedAvalibleText]}>Disponible</Text>
          </View>
}
      </View>
    </Pressable>
  );
  };
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
            horizontal={true}
            keyExtractor={(item) => item.id}
            renderItem={renderItemHour}
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
    headerTitle: ProductName(),
    headerTitleStyle: {
      color: '#ffffff',
      fontSize: 25,
    }
  });
  return (
<SafeAreaView>
    <View style={styles.ZoneImage}>
    {
         imgSrc() && <ImageBackground source={{ uri: imgSrc() }} style={styles.backgroundProduct} />
    }
    </View>
    <View style={styles.ZoneCalendar}>
        <View style={styles.YearZoneSelector}>
          <FlatList
            data={years}
            horizontal={true}
            keyExtractor={(item)=>item.toString()}
            renderItem={({item}) => (
              <>
                <Pressable onPress={() => {setSelectYear(item)}} style={[styles.yearContainer, selectYear === item && styles.containerSelected]}>
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
          <View>
          <Text style={[styles.titleHours]}>HORAS DISPONIBLES</Text>
            {loading ? <Loading/> : renderHours()}
          </View>
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
    position:'relative', 
    width: 180,
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
  titleHours: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    marginTop: 20,
    alignSelf: 'center',
  },
  activeHour: {
    color: 'green', 
  },
  inactiveHour: {

    color: 'red', 
  },
  disabledButton: {

    opacity: 0.5, 
    backgroundColor: '#e0e0e0',
  },
  tagbookedContainer: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    backgroundColor: 'red',
    padding: 5,
    borderBottomLeftRadius: 8,
    borderTopLeftRadius: 8,
  },
  tagbookedAvalibleContainer:{
    position: 'absolute',
    right: 0,
    bottom: 0,
    backgroundColor: 'green',
    padding: 5,
    borderBottomLeftRadius: 8,
    borderTopLeftRadius: 8,
  },
  tagbooked: {
    backgroundColor: 'red', 
  },
  tagAvaliblebooked: {
    backgroundColor: 'green', 
  },
  tagbookedText: {
    color: 'white',
    fontSize: 10,
  },
  tagbookedAvalibleText: {
    color: 'white',
    fontSize: 10,
  },
  selectedHour: {
    backgroundColor: '#A168DE',
  },
  });

export default Calendar;
