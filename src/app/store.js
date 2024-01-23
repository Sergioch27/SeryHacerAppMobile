import { modal1Reducer, modal2Reducer, modal3Reducer } from '../features/modal/modalSlice';
import { configureStore } from '@reduxjs/toolkit';
import { api } from '../../service/FireBaseService';
import { combineReducers } from 'redux';

export default configureStore({
  reducer: {
    modal: combineReducers({
      modal1: modal1Reducer,
      modal2: modal2Reducer,
      modal3: modal3Reducer,
    }),
    [api.reducerPath]: api.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(api.middleware),
});