import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, Button, SafeAreaView, StyleSheet} from 'react-native';
import Checkbox from 'expo-checkbox';

const Task = ({ task, onEliminar, onCompletar }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [completada, setCompletada] = useState(task.completada);


  const abrirModal = () => setModalVisible(true);
  const cerrarModal = () => setModalVisible(false);

  const toggleCompletada = () => {
    setCompletada(!completada);
    onCompletar();
  };

  return (
    <SafeAreaView>
      <View style={styles.ContentTask}>
      <Checkbox value={completada} onValueChange={toggleCompletada} color={completada ? 'green' : undefined} />
        <TouchableOpacity onPress={onCompletar}>
          <Text style={{ color: completada ? 'green' : 'black', textDecorationLine: completada ? 'line-through' : 'none' }}>
            {task.texto}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={abrirModal}>
          <Text style={{ color: 'red' }}>Eliminar</Text>
        </TouchableOpacity>

        <Modal visible={modalVisible} animationType="slide" transparent={true}>
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <View style={{ backgroundColor: 'white', padding: 20, borderRadius: 10, elevation: 5 }}>
              <Text>¿Estás seguro de que deseas eliminar esta tarea?</Text>
              <Button title="Eliminar" onPress={() => { onEliminar(); cerrarModal(); }} />
              <Button title="Cancelar" onPress={cerrarModal} color="gray" />
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

export default Task;

const styles = StyleSheet.create({
  ContentTask: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
  }
});
