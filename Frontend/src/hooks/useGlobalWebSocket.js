import { useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { setPosts, setLoading, fetchPosts } from '../store/requestsSlice';

export function useGlobalWebSocket(userRole) {
  const dispatch = useDispatch();
  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      dispatch(setLoading(false));
      return;
    }

    // Fetch initial posts instantly via HTTP REST API
    dispatch(fetchPosts());

    const apiUrl = import.meta.env.VITE_API_URL;
    const wsUrl = apiUrl.replace(/^http/, 'ws') + '/posts/ws?token=' + encodeURIComponent(token);

    function connect() {
      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        console.log('Global Posts WebSocket connected');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (Array.isArray(data)) {
            dispatch(setPosts(data));
          }
          dispatch(setLoading(false));
        } catch (err) {
          console.error('Error parsing posts WS data:', err);
        }
      };

      ws.onerror = (err) => {
        console.warn('Global Posts WebSocket error (using HTTP fallback):', err);
      };

      ws.onclose = (event) => {
        if (!event.wasClean) {
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, 5000);
        }
      };
    }

    connect();

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

