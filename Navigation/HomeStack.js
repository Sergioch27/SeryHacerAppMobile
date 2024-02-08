import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginView from '../src/screens/LoginView';
import RegisterView from '../src/screens/RegisterView';
import RecoverPasswordView from '../src/screens/RecoverPasswordView';
import ShopTab from './Shoptab';
import ProductDetailsView from '../src/screens/ProductDetailsView';
import ProfileChangeImg from '../src/components/ProfileChangeImg';

const Stack = createNativeStackNavigator();

const HomeStack = () => {
    return (
            <Stack.Navigator
                initialRouteName='ShopTab'
            >
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
                <Stack.Screen
                    name="ShopTab"
                    options={{ headerShown: false }}
                    component={ShopTab}
                />
                <Stack.Screen
                    name="ProductDetailsView"
                    component={ProductDetailsView}
                />
                <Stack.Screen
                    name="ProfileChangeImg"
                    options={{ headerShown: false }}
                    component={ProfileChangeImg}
                />
            </Stack.Navigator>
    );
}

export default HomeStack;