import api from "./axiosConfig";

// Interceptor to inject JWT token in the Authorization headers
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor to handle specific HTTP errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn('Unauthorized! Logging out user.');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Dispatch custom event or redirect window if needed
      window.dispatchEvent(new Event('auth-logout'));
    }
    return Promise.reject(error);
  }
);

// Authentication Endpoints API
export const authApi = {
  register: (userData) => api.post('/auth/register', userData),
  login: async (credentials) => {
    // credentials format: { username: "email/phone", password: "password" }
    const response = await api.post('/auth/login', credentials);
    if (response.data?.access_token) {
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.dispatchEvent(new Event('auth-logout'));
  },
  getMe: () => api.get('/auth/me'),
  verifyEmail: (data) => api.post('/auth/verify/email', data),
  verifyPhone: (data) => api.post('/auth/verify/phone', data),
  updateHostProfile: (data) => api.put('/auth/profile/host', data),
  updateGuestProfile: (data) => api.put('/auth/profile/guest', data),
};

// Listings (Host profiles search and listing management) API
export const listingsApi = {
  create: (listingData) => api.post('/listings', listingData),
  getMyListings: () => api.get('/listings/my'),
  deleteListing: (id) => api.delete(`/listings/${id}`),
  searchHosts: (params) => api.get('/listings/search', { params }), // city, kashrut_level
};

// Posts (Guest open boards requests) API
export const postsApi = {
  create: (postData) => api.post('/posts', postData),
  getOpenPosts: () => api.get('/posts'),
  claimPost: (id) => api.post(`/posts/${id}/claim`),
};

// Bookings / Matches API
export const bookingsApi = {
  requestBooking: (data) => api.post('/bookings/request', data),
  getIncomingBookings: () => api.get('/bookings/incoming'),
  respondToBooking: (matchId, status) => api.patch(`/bookings/${matchId}/respond`, { status }), // status: "accepted" or "rejected"
  getMatchDetails: (matchId) => api.get(`/matches/${matchId}/details`),
};

export default api;