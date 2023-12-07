import React, { useState } from "react";
import RegisterForm from "../components/RegisterForm";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";


const RegisterView = () => {
    return (
        <KeyboardAwareScrollView>
            <RegisterForm />
        </KeyboardAwareScrollView>
    );
};


export default RegisterView;