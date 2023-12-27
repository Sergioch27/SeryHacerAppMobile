import RecoveryForm from "../components/RecoveryForm";
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

const RecoverPasswordView = ()=>{
  return (
    <KeyboardAwareScrollView>
    <RecoveryForm />
    </KeyboardAwareScrollView>
  )
}
export default RecoverPasswordView