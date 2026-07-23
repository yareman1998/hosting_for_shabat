import { configureStore } from '@reduxjs/toolkit';
import requestsReducer from './requestsSlice';
import authReducer from './authSlice';
import availabilityReducer from './availabilitySlice';
import statsReducer from './statsSlice';
import notificationsReducer from './notificationsSlice';

export const store = configureStore({
  reducer: {
    requests: requestsReducer,
    auth: authReducer,
    availability: availabilityReducer,
    stats: statsReducer,
    notifications: notificationsReducer,
  },
});
