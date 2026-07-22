import { useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { setPosts, setLoading, setError, setIsMockData, fetchBadgeCount } from '../store/requestsSlice';
import { mockPosts } from '../data/postsMockData';

export function useGlobalWebSocket(userRole) {
  const dispatch = useDispatch();
  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      if (userRole === 'guest') {
        dispatch(setPosts(mockPosts));
        dispatch(setIsMockData(true));
      }
      dispatch(setLoading(false));
      return;
    }

    const apiUrl = import.meta.env.VITE_API_URL;
    const wsUrl = apiUrl.replace(/^http/, 'ws') + '/posts/ws?token=' + encodeURIComponent(token);

    function connect() {
      dispatch(setError(null));
      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        console.log('Global Posts WebSocket connected');
        dispatch(setError(null));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (Array.isArray(data)) {
            if (data.length === 0) {
              if (userRole === 'guest') {
                dispatch(setPosts(mockPosts));
                dispatch(setIsMockData(true));
              } else {
                dispatch(setPosts([]));
                dispatch(setIsMockData(false));
              }
            } else {
              dispatch(setPosts(data));
              dispatch(setIsMockData(false));
            }
            // Trigger badge count update on new WebSocket messages
            dispatch(fetchBadgeCount(userRole));
          }
          dispatch(setLoading(false));
        } catch (err) {
          console.error('Error parsing posts WS data:', err);
        }
      };

      ws.onerror = (err) => {
        console.error('Global Posts WebSocket error:', err);
        dispatch(setError('שגיאה בחיבור לשרת'));
        if (userRole === 'guest') {
          dispatch(setPosts(mockPosts));
          dispatch(setIsMockData(true));
        }
        dispatch(setLoading(false));
      };

      ws.onclose = () => {
        console.log('Global Posts WebSocket closed, attempting reconnect...');
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 5000);
      };
    }

    connect();

    // Fetch initial badge count
    dispatch(fetchBadgeCount(userRole));

    return () => {
      if (socketRef.current) {
        socketRef.current.onclose = null; // Prevent reconnect loop
        socketRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [userRole, dispatch]);
}
