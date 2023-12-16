import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import React from 'react';
import LoginView from './src/screens/LoginView';
import RegisterView from './src/screens/RegisterView';
import RecoverPasswordView from './src/screens/RecoverPasswordView';


const Stack = createStackNavigator();

export default function App() {
  const ref = React.useRef(null);
  return (
    <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen
            name="LoginView"
            options={{ headerShown: false }}
            component={LoginView}
          />
          <Stack.Screen
            name="RegisterView" 
            options={{ headerShown: false }}
            component={RegisterView}
          />
                    <Stack.Screen
            name="RecoverPasswordView"
            options={{ headerShown: false }}
            component={RecoverPasswordView}
          />
        </Stack.Navigator>
      </NavigationContainer>
  );
}