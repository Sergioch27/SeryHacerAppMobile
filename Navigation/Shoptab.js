import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import ProductView from '../src/screens/ProductView';
import OrderView from '../src/screens/OrderView';
import PodcastView from '../src/screens/PodcastView';
import ProfileView from '../src/screens/ProfileView';
import { StyleSheet, View } from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FontAwesome5 } from '@expo/vector-icons'; 

const Tab = createBottomTabNavigator();

const  ShopTab = () => {
    return (
      <Tab.Navigator
        style={styles.tabBar}
        screenOptions={{
          tabBarShowLabel: false,
          tabBarStyle: styles.tabBar,
          tabBarHideOnKeyboard: true,
          headerShown: false,
        }}
      >
        <Tab.Screen name="ProductView" component={ProductView} options={{ headerShown: false,
                tabBarIcon:({focused}) => {
          return (
            <View style={{ alignItems: 'center', justifyContent: 'center', top: 15 }}>
            <MaterialCommunityIcons name="office-building-marker" size={30} color={focused? '#A168DE':'#000'} />
            </View>
          )}
         }}/>
        <Tab.Screen name="OrderView" component={OrderView} options={{ headerShown: false,
                tabBarIcon:({focused}) => {
          return (
            <View style={{ alignItems: 'center', justifyContent: 'center', top: 15 }}>
              <AntDesign name="calendar" size={30} color={focused? '#A168DE':'#000' }/>
            </View>
          )}
         }}/>
        <Tab.Screen name="PodcastView" component={PodcastView} options={{ headerShown: false,
        tabBarIcon:({focused}) => {
          return (
            <View style={{ alignItems: 'center', justifyContent: 'center', top: 15 }}>
              <FontAwesome5 name="podcast" size={30} color={focused? '#A168DE':'#000' } />
            </View>
          )} 
          } }/>
        <Tab.Screen name="ProfileView" component={ProfileView} options={{ headerShown: false,
                tabBarIcon:({focused}) => {
          return (
            <View style={{ alignItems: 'center', justifyContent: 'center', top: 15 }}>
            <MaterialCommunityIcons name="account-box" size={30} color={focused? '#A168DE':'#000' } />
            </View>
          )}
        }}/>
      </Tab.Navigator>
    );
  }
const styles = StyleSheet.create({
    tabBar: {
        position: 'absolute',
        bottom: 25,
        left: 63,
        right: 20,
        elevation: 4,
        backgroundColor: '#ffffff',
        borderRadius: 15,
        height: 60,
        width: 300,
        shadowColor: '#000',
    }
})
export default ShopTab;
