import { createSlice } from '@reduxjs/toolkit';

// validar campos en el formulario de registro y login 
export const modal1Slice = createSlice({
  name: 'modal1',
  initialState: {
    isOpen: false,
  },
  reducers: {
    setModal1: (state, action) => {
      state.isOpen = action.payload;
    },
  },
});

// Validar campo formulario login dev
export const modal2Slice = createSlice({
  name: 'modal2',
  initialState: {
    isOpen: false,
  },
  reducers: {
    setModal2: (state, action) => {
      state.isOpen = action.payload;
    },
  },
});

// Modal confirmar cierre de sesión
export const modal3Slice = createSlice({
  name: 'modal3',
  initialState: {
    isOpen: false,
  },
  reducers: {
    setModal3: (state, action) => {
      state.isOpen = action.payload;
    },
  },
});


export const { setModal1 } = modal1Slice.actions;
export const { setModal2 } = modal2Slice.actions;
export const { setModal3 } = modal3Slice.actions;


export const modal1Reducer = modal1Slice.reducer;
export const modal2Reducer = modal2Slice.reducer;
export const modal3Reducer = modal3Slice.reducer;