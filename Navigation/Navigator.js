import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import HomeStack from './HomeStack';
import { APP_SCHEME } from '../service/mobile_reservation_models';

const linking = {
    prefixes: [`${APP_SCHEME}://`],
    config: {
        screens: {
            PaymentResultView: 'payment-result',
        },
    },
};
const Navigator = () => {
    return (
        <NavigationContainer linking={linking}>
            <HomeStack />
        </NavigationContainer>
    );
}

export default Navigator;
