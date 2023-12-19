import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginView from '../src/screens/LoginView';
import RegisterView from '../src/screens/RegisterView';
import RecoverPasswordView from '../src/screens/RecoverPasswordView';

const Stack = createNativeStackNavigator();


const Navigator = () => {
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

export default Navigator;