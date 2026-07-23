import { configureStore } from '@reduxjs/toolkit';
import requestsReducer from './requestsSlice';
import authReducer from './authSlice';
import availabilityReducer from './availabilitySlice';

export const store = configureStore({
  reducer: {
    requests: requestsReducer,
    auth: authReducer,
    availability: availabilityReducer,
  },
});
