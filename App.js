import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import React from 'react';
import {
  Button,
  Alert,
} from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <Text>Esta sera mi App</Text>
      <Button
        title="PRESIONAME"
        onPress={() => Alert.alert('MI PRIMER BOTON')}
      />
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
