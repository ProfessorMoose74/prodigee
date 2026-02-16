import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:5000';
let socket: Socket;

export const connectSocket = (token: string) => {
  socket = io(SOCKET_URL, {
    auth: { token }, // Session cookie should be sent automatically
    transports: ['websocket'],
  });

  socket.on('connect', () => {
    console.log('Socket connected:', socket.id);
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected');
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) socket.disconnect();
};

export const subscribeToParentEvents = (parentId: string, callback: (data: any) => void) => {
  if (!socket) return;
  socket.emit('join_parent_room', { parent_id: parentId });
  socket.on('live_progress_update', callback);
  socket.on('struggle_alert', callback);
};