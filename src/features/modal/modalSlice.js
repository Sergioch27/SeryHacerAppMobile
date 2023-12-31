import { createSlice } from '@reduxjs/toolkit';


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

export const { setModal1 } = modal1Slice.actions;
export const { setModal2 } = modal2Slice.actions;

export const modal1Reducer = modal1Slice.reducer;
export const modal2Reducer = modal2Slice.reducer;