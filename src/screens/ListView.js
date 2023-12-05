import React, { useState } from 'react';
import { View, StyleSheet, SafeAreaView, Pressable, Text } from 'react-native';
import TaskList from '../components/TaskList';
import { TextInput } from 'react-native-gesture-handler';

const ListView = () => {
    const [task, setTask] = useState([]);
    const [NewTask, setNewTask] = useState('');

    const AddTask = () =>{
        if(NewTask.trim() !== '' ) {
            setTask([...task,{id:Date.now(), texto: NewTask, completada: false}]);
            setNewTask('');
        }
    };

    const DeleteTask = (id) => {
        setTask(task.filter((task)=> task.id !==id));
    };
    const CompleteTask = (id) => {
        setTask(
            task.map((task)=> task.is === id ? {...task, completada: !task.completada}: task)
        )
    };
  return (
    <SafeAreaView >
    <View style={styles.content}>
        <TextInput
            style={styles.input}
            placeholder="Nueva Tarea"
            value={NewTask}
            onChangeText={(text)=>setNewTask(text)}
        />
        <Pressable onPress={AddTask} style={styles.buttonLogin}>
            <Text style={styles.textPressable}>AGREGAR TAREA</Text>
        </Pressable>
    </View>
    <TaskList
            task={task} onEliminar={DeleteTask} onCompletar={CompleteTask}
        />
    </SafeAreaView>
  )
  }
export default ListView;

const styles = StyleSheet.create({
    content:{
        marginTop: 30,
        alignItems:'center'
    },
    input: {
        height: 60,
        width:300,
        margin: 15,
        borderWidth: 2,
        borderRadius:10,
        padding: 10,
        shadowColor: "#000000",
    },
    buttonLogin:{
        height: 50,
        width: 200,
        justifyContent: "center",
        alignItems: "center",
        borderRadius:15,
        backgroundColor: '#A168DE',
      },
      textPressable:{
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
        letterSpacing: 0.25,
      },
  
  });