import { combineReducers, configureStore } from '@reduxjs/toolkit'
import {modal1Reducer, modal2Reducer} from '../features/modal/modalSlice'

export default configureStore({
    reducer: {
        modal: combineReducers({
            modal1: modal1Reducer,
            modal2: modal2Reducer,
        }),
    }
})