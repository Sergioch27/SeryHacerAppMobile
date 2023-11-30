import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import React from 'react';
import LoginView from './src/screens/LoginView';
import RegisterView from './src/screens/RegisterView';


const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen
            name="Home"
            options={{ headerShown: false }}
            component={LoginView}
          />
          <Stack.Screen
            name="registerer"
            options={{ headerShown: false }}
            component={RegisterView}
          />
        </Stack.Navigator>
      </NavigationContainer>
  );
}