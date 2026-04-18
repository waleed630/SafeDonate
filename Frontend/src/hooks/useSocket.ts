import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../contexts/AuthContext';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export function useSocket() {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    try {
      const s = io(SOCKET_URL, {
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        auth: {
          token: localStorage.getItem('token'),
        },
      });

      s.on('connect', () => {
        console.log('✅ Socket connected:', s.id);
        setConnected(true);
        
        // Register user as online when connected
        if (user?.id) {
          console.log('📱 Registering user as online:', user.id);
          s.emit('registerOnline', { userId: user.id });
        }
      });

      s.on('connect_error', (error) => {
        console.error('❌ Socket connection error:', error);
        setConnected(false);
      });

      s.on('disconnect', () => {
        console.log('❌ Socket disconnected');
        setConnected(false);
      });

      setSocket(s);

      return () => {
        s.disconnect();
      };
    } catch (err) {
      console.error('🔥 Socket initialization error:', err);
      return undefined;
    }
  }, [user?.id]);

  return { socket, connected };
}
