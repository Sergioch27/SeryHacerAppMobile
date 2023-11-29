import React , {useEffect, useState } from "react";
import { TextInput } from "react-native";

const LoginInput = (props, {password,username}) => {
    const [text, setText] = useState('');

    return (
                <TextInput
                    {...props}
                />
    )
}
export default LoginInput