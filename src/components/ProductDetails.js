import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, Pressable, ImageBackground, ScrollView, Modal} from 'react-native';
import { format, startOfMonth, lastDayOfMonth, eachDayOfInterval, isSameDay, eachHourOfInterval, set} from 'date-fns';
import { useRoute } from '@react-navigation/native';
import { AntDesign } from '@expo/vector-icons';
import Loading from "./smart_components/Loading";
import { useNavigation } from '@react-navigation/native';
import { GetHours } from '../../service/wp_service';
import { useDispatch, useSelector } from 'react-redux';
import { addReservationToCart, clearCartError } from '../features/cart/cartReservationSlice';
import { useSafeAreaInsets } from 'react-native-safe-area-context';


const Calendar = () => {
  const route = useRoute();
  const { productItem } = route.params
  const   navigation = useNavigation();
  const dispatch = useDispatch();
  const cartItems = useSelector((state) => state.cart.items);
  const cartErrorMessage = useSelector((state) => state.cart.errorMessage);
  const insets = useSafeAreaInsets();
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const years= [2026,2027];
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
  const [ShowTypeBooking, setShowTypeBooking] = useState(false);
  const [ShowRenderHour, setShowRenderHour] = useState(false);
  const [selectedButton, setSelectedButton] = useState(null);
  const [ButtonPressed, setButtonPressed] = useState(false);
  const [LoadingHours, setLoadingHours] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const primaryProduct = Array.isArray(productItem) && productItem.length > 0 ? productItem[0] : productItem;
  const parentProduct = primaryProduct?.parent_data ?? null;
  const detailProduct = parentProduct ?? primaryProduct;
  const variationProducts = Array.isArray(productItem) ? productItem : [primaryProduct].filter(Boolean);

  const getMetaValue = (product, key) => {
    const metaItem = product?.meta_data?.find((item) => item?.key === key);
    return metaItem?.value;
  };

  const getBookingOptionsFromAttribute = (attribute) => {
    if (!attribute || attribute.name !== 'TIPO DE RESERVA') {
      return [];
    }

    if (attribute.option) {
      return [attribute.option];
    }

    if (Array.isArray(attribute.options)) {
      return attribute.options.filter(Boolean);
    }

    return [];
  };

  const imgSrc = ()=>{
    if (detailProduct?.images?.length > 0) {
      return detailProduct.images[0].src;
    }

    if (primaryProduct?.image?.src) {
      return primaryProduct.image.src;
    }

    if (primaryProduct?.images?.length > 0) {
      return primaryProduct.images[0].src;
    }

    return null;
  };

const ProductName = ()  => {
  if (detailProduct?.name) {
    return detailProduct.name;
  }

  return primaryProduct?.name ?? '';
};
const ProductPrice = () => {
  const price = detailProduct?.price ?? detailProduct?.regular_price ?? primaryProduct?.price ?? primaryProduct?.regular_price ?? '';

  if (!price) {
    return '';
  }

  return `$${price}`;
};

const ProductDescription = () => {
  const rawDescription = detailProduct?.description ?? detailProduct?.short_description ?? primaryProduct?.description ?? primaryProduct?.short_description ?? '';

  return rawDescription
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};
    const formBookingValue = [];
    variationProducts.forEach((element) => {
      const productFormValue = getMetaValue(element, 'bookacti_variable_form') ?? element?.bookacti_form_id;

      if (productFormValue && formBookingValue.indexOf(productFormValue) === -1) {
        formBookingValue.push(productFormValue);
      }
    });

    const parentFormValue = getMetaValue(detailProduct, 'bookacti_variable_form') ?? detailProduct?.bookacti_form_id;
    if (parentFormValue && formBookingValue.indexOf(parentFormValue) === -1) {
      formBookingValue.push(parentFormValue);
    }

    console.log('[ProductDetails] productItem:', productItem);
    console.log('[ProductDetails] detailProduct:', detailProduct);
    console.log('[ProductDetails] formBookingValue', formBookingValue);
    console.log('[ProductDetails] variation booking payloads:', variationProducts.map((variation) => ({
      id: variation?.id,
      parent_id: variation?.parent_id,
      attributes: variation?.attributes,
      meta_form: getMetaValue(variation, 'bookacti_variable_form'),
      top_form: variation?.bookacti_form_id,
    })));
  const generateUniqueId = () => {
    return '_' + Math.random().toString(36);
  };

const typeBooking = [];
variationProducts.forEach((element) => {
  (element?.attributes ?? []).forEach((attribute) => {
    getBookingOptionsFromAttribute(attribute).forEach((bookingType) => {
      if (typeBooking.indexOf(bookingType) === -1) {
        typeBooking.push(bookingType);
      }
    });
  });
});

(detailProduct?.attributes ?? []).forEach((attribute) => {
  getBookingOptionsFromAttribute(attribute).forEach((bookingType) => {
    if (typeBooking.indexOf(bookingType) === -1) {
      typeBooking.push(bookingType);
    }
  });
});

console.log('[ProductDetails] typeBooking', typeBooking);
const hasBookingConfig = formBookingValue.length > 0;
const availableBookingTypes = [...new Set(typeBooking.filter(Boolean))];
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
  setShowRenderHour(false);
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
    if (!hasBookingConfig) {
      setShowTypeBooking(false);
      setLoading(false);
      return;
    }

    const CheckHour = dateSelected();
    GetHours(CheckHour).then((res) => {
      const BookedEvent = res.map(item => ({
        ...item,
        event_start: item.fechaHora.split(' ')[1].slice(0, -6),
      }));

      console.log('Horas Disponibles:', BookedEvent);
      setBookedHours(BookedEvent);
      setShowTypeBooking(true);
      setLoading(false);
    });
    setHasExecuted(true);

  }
  if (selectDay) {
    setHasExecuted(false);
  }
}, [selectDay, currentDay, hasExecuted, selectMonth, selectYear, hasBookingConfig]);

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

const setSelectDayAndCurrentDay = async (selectedDate) => {
  setLoading(true); // Activa el estado de carga
  setBookedHours([{}]); // Reinicia horas reservadas
  setHasExecuted(false); // Reinicia el estado de ejecución

  try {
    if (!isSameDay(selectedDate, currentDay)) {
      setSelectDay(selectedDate); // Actualiza el día seleccionado
    }
    setCurrentDay(selectedDate); // Actualiza siempre el día actual

    // Simula o realiza una carga de datos aquí
    await fetchBookingData(selectedDate); // Asegúrate de que esta función sea asíncrona
  } catch (error) {
    console.error("Error al cargar datos:", error);
  } finally {
    setLoading(false); // Desactiva el estado de carga al final
  }
};

const fetchBookingData = async (date) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log(`Datos cargados para el día: ${date}`);
      resolve();
    }, 1000);
  });
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
  const isJornada4 = selectedButton === 'JORNADA 4 HORAS';
  const isUnaHora = selectedButton === '1 HORA';
  const now = new Date();
  const isToday = item?.date ? isSameDay(item.date, now) : false;
  const isPastHour = isToday && item.startHour <= now.getHours();

  if (isPastHour) {
    return;
  }

  const startHour = item.startHour;
  const requiredHours = 4;
  const date = item.date;

  // Fecha actual en formato
  const horaInicio = `${startHour < 10 ? '0' : ''}${startHour}:00:00`;
  const horaFin = `${startHour + 1 < 10 ? '0' : ''}${startHour + 1}:00:00`;

  const horaSimple = {
    año: date.getFullYear(),
    mes: date.getMonth() + 1,
    dia: date.getDate(),
    horaInicio,
    horaFin,
  };

  if (isUnaHora) {
    // === MODO 1 HORA ===

    const yaSeleccionada = fechasSeleccionadas.find(f =>
      f.año === horaSimple.año &&
      f.mes === horaSimple.mes &&
      f.dia === horaSimple.dia &&
      f.horaInicio === horaSimple.horaInicio
    );

    if (yaSeleccionada) {
      // Desmarcar esa hora individual
      const nuevas = fechasSeleccionadas.filter(f =>
        !(f.año === horaSimple.año &&
          f.mes === horaSimple.mes &&
          f.dia === horaSimple.dia &&
          f.horaInicio === horaSimple.horaInicio)
      );
      setFechasSeleccionadas(nuevas);
      const { bloques4Horas, horasIndividuales } = clasificarFechasSeleccionadas(nuevas);
      console.log("🟪 BLOQUES DE 4 HORAS:", bloques4Horas);
      console.log("🟩 HORAS INDIVIDUALES:", horasIndividuales);
    } else {
      // Marcarla como nueva hora individual
    const nuevas = [...fechasSeleccionadas, horaSimple];
    setFechasSeleccionadas(nuevas);
    const { bloques4Horas, horasIndividuales } = clasificarFechasSeleccionadas(nuevas);
    console.log("🟪 BLOQUES DE 4 HORAS:", bloques4Horas);
    console.log("🟩 HORAS INDIVIDUALES:", horasIndividuales);    }

    return;
  }

  // === MODO JORNADA 4 HORAS ===

  const bloqueNuevo = Array.from({ length: requiredHours }).map((_, i) => {
    const hour = startHour + i;
    return {
      año: date.getFullYear(),
      mes: date.getMonth() + 1,
      dia: date.getDate(),
      horaInicio: `${hour < 10 ? '0' : ''}${hour}:00:00`,
      horaFin: `${hour + 1 < 10 ? '0' : ''}${hour + 1}:00:00`,
    };
  });

  if (startHour + requiredHours > 22) {
    alert('Este bloque de 4 horas excede el horario disponible.');
    return;
  }

  // Detectar todas las horas seleccionadas en ese día
  const seleccionadasEseDia = fechasSeleccionadas.filter(f =>
    f.año === date.getFullYear() &&
    f.mes === date.getMonth() + 1 &&
    f.dia === date.getDate()
  );

  const bloqueYaSeleccionado = bloqueNuevo.every(hora =>
    seleccionadasEseDia.some(
      f => f.horaInicio === hora.horaInicio
    )
  );

  const primeraHora = `${startHour < 10 ? '0' : ''}${startHour}:00:00`;
  const estoyEnLaPrimeraDelBloque = seleccionadasEseDia.find(f => f.horaInicio === primeraHora);

  if (bloqueYaSeleccionado && estoyEnLaPrimeraDelBloque) {
    // Deseleccionar el bloque
    const nuevas = fechasSeleccionadas.filter(f =>
      !bloqueNuevo.some(b =>
        f.año === b.año &&
        f.mes === b.mes &&
        f.dia === b.dia &&
        f.horaInicio === b.horaInicio
      )
    );
    setFechasSeleccionadas(nuevas);
    const { bloques4Horas, horasIndividuales } = clasificarFechasSeleccionadas(nuevas);
    console.log("🟪 BLOQUES DE 4 HORAS:", bloques4Horas);
    console.log("🟩 HORAS INDIVIDUALES:", horasIndividuales);
    return;
  }

  // Verificar si alguna hora está reservada
  const bloqueOcupado = bloqueNuevo.some(hora =>
    bookedHours.some(b =>
      b.active === "1" &&
      b.event_start === hora.horaInicio.slice(0, 5)
    )
  );

  if (bloqueOcupado) {
    alert("No se puede seleccionar este bloque. Alguna hora está reservada.");
    return;
  }

  // Verificar si el bloque se cruza con otras selecciones (excepto el bloque actual)
  const conflictoConOtros = bloqueNuevo.some(hora =>
    fechasSeleccionadas.some(f =>
      f.horaInicio === hora.horaInicio &&
      f.dia === hora.dia &&
      f.mes === hora.mes &&
      f.año === hora.año &&
      !seleccionadasEseDia.find(sel => sel.horaInicio === hora.horaInicio) // excluir las actuales
    )
  );

  if (conflictoConOtros) {
    alert("Este bloque se cruza con otro bloque ya seleccionado.");
    return;
  }

  // Remover bloque actual si hay alguno
  const sinBloquesAnteriores = fechasSeleccionadas.filter(f =>
    f.año !== date.getFullYear() ||
    f.mes !== date.getMonth() + 1 ||
    f.dia !== date.getDate()
  );

  setFechasSeleccionadas([...sinBloquesAnteriores, ...bloqueNuevo]);
  const nuevas = [...sinBloquesAnteriores, ...bloqueNuevo];
  const { bloques4Horas} = clasificarFechasSeleccionadas(nuevas);
  console.log("🟪 BLOQUES DE 4 HORAS:", bloques4Horas);
};

// Funcion para renderizar un item de la lista de horas
  const renderItemHour = ({ item }) => {
    const startHour = item.startHour < 10 ? `0${item.startHour}` : item.startHour;
    const isBooked = bookedHours.find(booking => booking.active === "1" && booking.event_start === `${item.startHour}`);
    const now = new Date();
    const isPastHour = item?.date ? isSameDay(item.date, now) && item.startHour <= now.getHours() : false;
    const hourStyle = (isBooked || isPastHour) ? styles.inactiveHour : styles.activeHour;
    const isSelectHour = fechasSeleccionadas.find((fecha) => fecha.horaInicio === `${startHour}:00:00`);
    const selectedHour =  isSelectHour ? styles.selectedHour  : null;
    const ColorSelectedHour = isSelectHour ? styles.ColorSelected : null;
    return (
  <Pressable onPress={() => handlePress(item)} disabled={Boolean(isBooked || isPastHour)} >
      <View style={[styles.hourContainer, selectedHour]}>
      {isSelectHour ? <Text style={[styles.cardHour, hourStyle, ColorSelectedHour]}>{item.startHour}:00 - {item.endHour}:00</Text> 
      : <Text style={[styles.cardHour, hourStyle]}>{item.startHour}:00 - {item.endHour}:00</Text> }
        {isPastHour ? (
            <View style={ styles.tagbookedContainer}>
              <Text style={[styles.tagbooked,styles.tagbookedText]}>No disponible</Text>
            </View>
        ) : isBooked || selectedHour ?
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
  const renderTypeBooking = () => {
  const typeBookingCard =  availableBookingTypes.map((booking, index) => {
      if (booking === 'JORNADA 4 HORAS' || booking === '1 HORA') {
        return (
            <Pressable key={index} onPress={()=> typeBookingHandler(booking)}
            style={[styles.typeBookingStyle, booking === selectedButton ? styles.selectedButton : null]}>
              <Text style={styles.textTypeBooking}>{booking}</Text>
            </Pressable>
        );
      }
    });
    return (
      <View style={styles.typeBookingContainer}>
        {typeBookingCard}
      </View>
    )
    }

const typeBookingHandler = async (booking) => {
  setSelectedButton(booking);
  setButtonPressed(true);
  setLoadingHours(true);
  setShowRenderHour(true);
  await new Promise((resolve) => setTimeout(resolve, 1000));
  setShowRenderHour(true);
  setLoadingHours(false);
}

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
    headerStatusBarHeight: insets.top,
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
  
  const clasificarFechasSeleccionadas = (selecciones) => {
    
  const bloques4Horas = [];
  const horasIndividuales = [];

  // Agrupamos por fecha
  const agrupadasPorDia = {};

  selecciones.forEach((f) => {
    const clave = `${f.año}-${f.mes}-${f.dia}`;
    if (!agrupadasPorDia[clave]) agrupadasPorDia[clave] = [];
    agrupadasPorDia[clave].push(f);
  });

  Object.entries(agrupadasPorDia).forEach(([fecha, horas]) => {
    // Ordenamos por hora
    const ordenadas = horas.sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));
    const usadas = new Set();

    for (let i = 0; i < ordenadas.length; i++) {
      if (usadas.has(i)) continue;

      const bloque = [ordenadas[i]];
      let actual = ordenadas[i];

      for (let j = i + 1; j < ordenadas.length && bloque.length < 4; j++) {
        const siguiente = ordenadas[j];
        const actualHora = parseInt(actual.horaInicio.slice(0, 2));
        const siguienteHora = parseInt(siguiente.horaInicio.slice(0, 2));

        if (
          siguiente.año === actual.año &&
          siguiente.mes === actual.mes &&
          siguiente.dia === actual.dia &&
          siguienteHora === actualHora + 1
        ) {
          bloque.push(siguiente);
          actual = siguiente;
          usadas.add(j);
        } else {
          break;
        }
      }

      if (bloque.length === 4) {
        bloques4Horas.push(bloque);
        usadas.add(i);
      } else {
        // Menos de 4 → considerarlas individuales
        horasIndividuales.push(...bloque);
        bloque.forEach((_, idx) => usadas.add(i + idx));
      }
    }

    // Las que no se usaron, también van como individuales
    for (let k = 0; k < ordenadas.length; k++) {
      if (!usadas.has(k)) {
        horasIndividuales.push(ordenadas[k]);
      }
    }
  });

  return { bloques4Horas, horasIndividuales };
};

  const handleAddToCart = () => {
    if (fechasSeleccionadas.length === 0 || addingToCart) {
      if (fechasSeleccionadas.length === 0) {
        alert("Por favor selecciona al menos una hora para reservar.");
      }
      return;
    }

    setAddingToCart(true);
    dispatch(clearCartError());
    dispatch(addReservationToCart({
      productItem,
      reservas: fechasSeleccionadas,
      bookingType: selectedButton,
    }))
      .unwrap()
      .then(() => {
        setFechasSeleccionadas([]);
        setSelectedButton(null);
        setShowRenderHour(false);
        navigation.navigate('CartView');
      })
      .catch((error) => {
        alert(error?.message || 'No se pudo bloquear la reserva.');
      })
      .finally(() => {
        setAddingToCart(false);
      });
  };

  return (
<SafeAreaView style={{ flex: 1, backgroundColor: '#f8f9fa' }}>
  <Modal transparent visible={addingToCart} animationType="fade">
    <View style={styles.reserveOverlay}>
      <View style={styles.reserveOverlayCard}>
        <Loading />
        <Text style={styles.reserveOverlayTitle}>Pre-reservando tu box</Text>
        <Text style={styles.reserveOverlayText}>Espera un momento mientras confirmamos disponibilidad.</Text>
      </View>
    </View>
  </Modal>
  <ScrollView contentContainerStyle={{ paddingBottom: hasBookingConfig ? 120 : 40 }} showsVerticalScrollIndicator={false}>
      <View style={styles.ZoneImage}>
      {
        imgSrc() && <ImageBackground source={{ uri: imgSrc() }} style={styles.backgroundProduct} />
      }
      </View>
      <View style={styles.ZoneCalendar}>
          <View style={styles.productInfoCard}>
            <Text style={styles.productTitle}>{ProductName()}</Text>
            {ProductPrice() ? <Text style={styles.productPrice}>{ProductPrice()}</Text> : null}
            {ProductDescription() ? <Text style={styles.productDescription}>{ProductDescription()}</Text> : null}
          </View>
          {!hasBookingConfig ? (
            <View style={styles.noBookingCard}>
              <Text style={styles.noBookingTitle}>Detalle del producto</Text>
              <Text style={styles.noBookingText}>
                Este producto no tiene reserva por horas. La vista muestra la información actual del producto.
              </Text>
            </View>
          ) : (
            <>
          <View style={styles.YearZoneSelector}>
            <FlatList
              data={years}
              horizontal={true}
              keyExtractor={(item)=>item.toString()}
              renderItem={({item}) => (
                  <Pressable onPress={() => {setSelectYear(item)}} style={[styles.yearContainer, selectYear === item && styles.containerSelected]}>
                      <Text>{item}</Text>
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
                  <Pressable onPress={() => setSelectMonth(item.value)} style={[styles.card, selectMonth === item.value && styles.containerSelected]} >
                    <Text>{item.label}</Text>
                  </Pressable>
              )}
            />
          </View>
              {renderDays()}
              {loading ? (
                <Loading />
              ) : ShowTypeBooking && (
                <>
                  <Text style={styles.titleHours}>TIPO DE RESERVA</Text>
                  {renderTypeBooking()}
                </>
              )}
              {ShowRenderHour && (
                LoadingHours ? <Loading /> : 
                <View>
                  <Text style={[styles.titleHours]}>HORAS DISPONIBLES</Text>
                  {renderHours()}
                </View>
              )}
            </>
          )}
      </View>
  </ScrollView>

  {/* Barra Fija Inferior - Resumen de Reserva */}
  {hasBookingConfig ? <View style={styles.summaryContainer}>
    <View style={styles.summaryTextContainer}>
      <Text style={styles.summaryTitle}>
        Día: {selectDay ? format(selectDay, 'dd/MM/yyyy') : format(currentDay, 'dd/MM/yyyy')}
      </Text>
      <Text style={styles.summarySubtitle}>
        {fechasSeleccionadas.length} hora(s) seleccionada(s)
      </Text>
      {cartItems.length > 0 ? <Text style={styles.summaryWarning}>Ya existe una reserva activa en el carrito.</Text> : null}
      {cartErrorMessage ? <Text style={styles.summaryError}>{cartErrorMessage}</Text> : null}
    </View>
    <Pressable 
      style={[styles.addToCartButton, (fechasSeleccionadas.length === 0 || addingToCart) && styles.disabledButton]} 
      onPress={handleAddToCart}
      disabled={fechasSeleccionadas.length === 0 || addingToCart}
    >
      <Text style={styles.addToCartText}>Añadir al Carrito</Text>
    </Pressable>
  </View> : null}
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
  reserveOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  reserveOverlayCard: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: '#ffffff',
    borderRadius: 18,
    paddingVertical: 28,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  reserveOverlayTitle: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '700',
    color: '#222222',
    textAlign: 'center',
  },
  reserveOverlayText: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 20,
    color: '#666666',
    textAlign: 'center',
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
  productInfoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  productTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#222222',
  },
  productPrice: {
    marginTop: 8,
    fontSize: 20,
    fontWeight: '700',
    color: '#A168DE',
  },
  productDescription: {
    marginTop: 12,
    fontSize: 15,
    lineHeight: 22,
    color: '#555555',
  },
  noBookingCard: {
    backgroundColor: '#f2edf9',
    borderRadius: 20,
    padding: 20,
  },
  noBookingTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#222222',
    marginBottom: 8,
  },
  noBookingText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#555555',
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
  ColorSelected: {
    color: 'red',
  },
  typeBookingStyle: {
    padding: 20,
    margin: 5,
    borderRadius: 8,
    backgroundColor: '#e0e0e0',
    alignItems: 'center',
  },
  typeBookingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textTypeBooking: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  selectedButton: {
    backgroundColor: '#A168DE',
  },
  summaryContainer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: '#ffffff',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 10,
  },
  summaryTextContainer: {
    flex: 1,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  summarySubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  summaryWarning: {
    marginTop: 6,
    fontSize: 12,
    color: '#8a5a1f',
  },
  summaryError: {
    marginTop: 6,
    fontSize: 12,
    color: '#b42318',
  },
  addToCartButton: {
    backgroundColor: '#A168DE',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addToCartText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  });

export default Calendar;
