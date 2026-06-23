import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const { token, user } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const prevAlertsCount = useRef(0);
  
  // Play synthesizer beep sound for warnings
  const playBeep = (freq = 660, type = 'sine', duration = 0.3) => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
      
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      
      osc.start();
      setTimeout(() => {
        try { osc.stop(); } catch(e){}
        audioCtx.close();
      }, duration * 1000 + 100);
    } catch (e) {
      console.warn('Web Audio warning:', e);
    }
  };

  // Play double high alarm beep for critical SOS alerts
  const playSosAlarm = () => {
    playBeep(880, 'sawtooth', 0.15);
    setTimeout(() => playBeep(880, 'sawtooth', 0.15), 200);
  };

  const fetchAlerts = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/location/alerts', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        const sorted = data.data;
        setAlerts(sorted);

        // Count unread (any active alert is considered unread in our demo logs)
        const activeCount = sorted.filter(a => a.status === 'Active').length;
        setUnreadCount(activeCount);

        // Sound trigger triggers if alert counts increase
        if (sorted.length > prevAlertsCount.current) {
          const newAlerts = sorted.slice(0, sorted.length - prevAlertsCount.current);
          const hasSos = newAlerts.some(a => a.type === 'SOS');
          
          if (hasSos) {
            playSosAlarm();
          } else {
            playBeep(520, 'sine', 0.2); // standard entry/exit geofence beep
          }
        }
        prevAlertsCount.current = sorted.length;
      }
    } catch (error) {
      console.error('Error fetching system alerts:', error);
    }
  };

  // Polling setup: Check alerts every 5 seconds
  useEffect(() => {
    if (token) {
      fetchAlerts(); // initial load
      const interval = setInterval(fetchAlerts, 5000);
      return () => clearInterval(interval);
    } else {
      setAlerts([]);
      setUnreadCount(0);
      prevAlertsCount.current = 0;
    }
  }, [token]);

  const markAllRead = () => {
    setUnreadCount(0);
  };

  const value = {
    alerts,
    unreadCount,
    markAllRead,
    refreshAlerts: fetchAlerts,
    playBeep
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
