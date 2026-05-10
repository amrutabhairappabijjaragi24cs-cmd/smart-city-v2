import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { token } = useAuth();

  const [connected, setConnected] = useState(false);
  const [sensorData, setSensorData] = useState([]);
  const [latestAlerts, setLatestAlerts] = useState([]);

  const socketRef = useRef(null);

  useEffect(() => {
    if (!token) return;

    const socket = io('https://smartcity-backend-xsxs.onrender.com', {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 2000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      console.log('[Socket] Connected');
    });

    socket.on('disconnect', () => {
      setConnected(false);
      console.log('[Socket] Disconnected');
    });

    socket.on('connect_error', (e) => {
      console.log('[Socket] Error:', e.message);
    });

    socket.on('sensor_update', (d) => {
      setSensorData(Array.isArray(d) ? d : []);
    });

    socket.on('new_alert', (a) => {
      setLatestAlerts((p) => [a, ...p].slice(0, 30));
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [token]);

  return (
    <SocketContext.Provider
      value={{
        connected,
        sensorData,
        latestAlerts,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);