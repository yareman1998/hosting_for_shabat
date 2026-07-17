import axios from 'axios';

const api = axios.create({
  // Change this to your production URL when you host it
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;