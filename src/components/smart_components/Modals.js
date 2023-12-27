import React,  {useState} from "react";
import { Modal, Pressable, Text, View, StyleSheet } from "react-native";
import LoginInput from "./LoginInput";
import { AntDesign } from '@expo/vector-icons';
import Loading from "./Loading";

const ModalViewLogin = ({isVisible,onClose,textTitle,textButton}) => {
    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={isVisible}
            onRequestClose={onClose}
            style={styles.ZIndex}>
            <View style={styles.centeredView}>
                <View style={styles.modalView}>
                    <Text style={styles.modalText}>{textTitle}</Text>
                    <Pressable
                        style={[styles.button, styles.buttonClose]}
                        onPress={onClose}>
                        <Text style={styles.textStyle}>{textButton}</Text>
                    </Pressable>
                </View>
            </View>
        </Modal>
    );
}

const ModalViewDev = ({isVisible,onClose,textTitle,textButton, sendData, warningMessage,username,password,setUsernameDevCallback,setPasswordDevCallback}) => {

    return (
        <View style={styles.contentInput}>
        <Modal
          animationType="slide"
          transparent={true}
          visible={isVisible}
          onRequestClose={onClose}>
          <View style={styles.centeredView}>
            <View style={styles.modalView}>
            <Pressable onPress={onClose}>
              <AntDesign style={styles.closeButton} name="closecircle" size={20} color="#A168DE" />
            </Pressable>
              <Text>{textTitle}</Text>
              <View style={styles.contentInput}>
    <LoginInput
    style={styles.input}
        placeholder={'USUARIO'}
        placeholderTextColor={'#888'}
        value={username}
        onChangeText={(text) => {setUsernameDevCallback(text);}}
    />
    <LoginInput
    style={styles.input}
            placeholder={'CONTRASEÑA'}
            placeholderTextColor={'#888'}
            value={password}
            onChangeText= {(text) => {setPasswordDevCallback(text);}}
            secureTextEntry={true}
    />
          <Pressable  style={styles.buttonLogin}  onPress={sendData}>
            {textButton}
          </Pressable>
          {warningMessage ? <Text>{warningMessage}</Text> : null}
    </View>
            </View>
          </View>
      </Modal>
      </View>
    );
}
const styles = StyleSheet.create({
    ZIndex:{
        zIndex: 1000,
    },
    centeredView: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        marginTop: 22,
    },
    modalView: {
        margin: 20,
        backgroundColor: "white",
        borderRadius: 20,
        padding: 15,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5
    },
    button: {
        borderRadius: 20,
        padding: 10,
        elevation: 2
    },
    buttonClose: {
        backgroundColor: "#A168DE",
    },
    textStyle: {
        color: "white",
        fontWeight: "bold",
        textAlign: "center"
    },
    modalText: {
        marginBottom: 15,
        textAlign: "center"
    },
    closeButton: {
        alignSelf: 'flex-end',
        marginLeft: 300,
    },
    contentInput:{
        alignItems: "center",
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
        height: 40,
        width: 300,
        justifyContent: "center",
        alignItems: "center",
        borderRadius:15,
        backgroundColor: '#A168DE',
      },
});

export {ModalViewLogin, ModalViewDev};
