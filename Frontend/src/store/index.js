import { configureStore } from '@reduxjs/toolkit';
import requestsReducer from './requestsSlice';
import authReducer from './authSlice';
import availabilityReducer from './availabilitySlice';
import chatReducer from './chatSlice';

export const store = configureStore({
  reducer: {
    requests: requestsReducer,
    auth: authReducer,
    availability: availabilityReducer,
    chat: chatReducer,
  },
});
