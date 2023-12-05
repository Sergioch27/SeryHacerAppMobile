import React from 'react';
import { View, FlatList, SafeAreaView, StyleSheet } from 'react-native';
import Task from './smart_components/Task';

const TaskList = ({ task, onEliminar, onCompletar }) => {
  return (
    <>
    <SafeAreaView>
        <View style={styles.contenedor}>
        <FlatList
            data={task}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <View style={styles.tarjeta}>
                  <Task
                      task={item}
                      onEliminar={() => onEliminar(item.id)}
                      onCompletar={() => onCompletar(item.id)}
                  />
              </View>
            )}
        />
        </View>
    </SafeAreaView>
    </>
  );
};

export default TaskList;

const styles = StyleSheet.create({
  contenedor: {
    padding: 10,
  },
  tarjeta: {
    backgroundColor: 'white',
    borderRadius: 10,
    elevation: 5,
    padding: 10,
    marginBottom: 10,
  },
});