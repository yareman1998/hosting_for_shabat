import { configureStore } from '@reduxjs/toolkit';
import requestsReducer from './requestsSlice';

export const store = configureStore({
  reducer: {
    requests: requestsReducer,
  },
});
