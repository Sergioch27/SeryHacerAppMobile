import React from "react";
import { SafeAreaView } from "react-native";

const RegisterView =()=>{
    return (
        <SafeAreaView>
            <View style={styles.contentImage} >
            <Image
                style={styles.imageLogo}
                source={images[0].logo}
            />
            </View>
            <View style={styles.contentText}>
              <Text style={styles.textTitle}>
              CREA TU CUENTA
              DATOS BÁSICOS.
              </Text>
            </View>
        </SafeAreaView>
    )
}

export default RegisterView