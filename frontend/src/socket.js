import { io } from 'socket.io-client';

let socket;

export function getSocket() {
  if (socket) return socket;

  const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
  const socketURL = baseURL.replace(/\/api\/?$/, '');

  const stored = localStorage.getItem('auth');
  let token = '';
  if (stored) {
    try {
      token = JSON.parse(stored)?.token || '';
    } catch (e) {
      token = '';
    }
  }

  socket = io(socketURL, {
    transports: ['websocket'],
    auth: { token },
  });

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}


