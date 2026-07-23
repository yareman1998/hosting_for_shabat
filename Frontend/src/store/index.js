import { configureStore } from '@reduxjs/toolkit';
import requestsReducer from './requestsSlice';
import authReducer from './authSlice';

export const store = configureStore({
  reducer: {
    requests: requestsReducer,
    auth: authReducer,
  },
});
