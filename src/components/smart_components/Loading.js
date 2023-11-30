import React from "react";
import {ActivityIndicator, View} from 'react-native';

const Loading = () =>{
    return (
        <>
            <View >
                <ActivityIndicator size="large" color='#000'  />
            </View>
        </>
    )
}
export default Loading