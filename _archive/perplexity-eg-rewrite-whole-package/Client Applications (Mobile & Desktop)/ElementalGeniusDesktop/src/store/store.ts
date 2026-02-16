import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import childReducer from './slices/childSlice';
import parentReducer from './slices/parentSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    child: childReducer,
    parent: parentReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;