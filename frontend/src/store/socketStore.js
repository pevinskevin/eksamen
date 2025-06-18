import { writable } from 'svelte/store';
import { io } from 'socket.io-client';

const socketUrl = import.meta.env.VITE_SOCKET_URL;
import authStore from './authStore';

const socket = io(`${socketUrl}`, { autoConnect: false });

socket.on('connect', () => {
    socketConnection.set(socket);
    isConnected.set(true);
    const rawId = authStore.accessUserId();
    if (rawId != null) {
      const userId = `user_${rawId}`;
      socket.emit('joinRoom', userId);
      socket.on('joined', (response)=>{
      })
    } else {
      console.warn('Skipping joinRoom: no authenticated user');
    }
});

socket.on('disconnect', () => {
    isConnected.set(false);
});

socket.on('orderBookDepthUpdate', (data) => {
    orderBookData.set(data);
});

socket.on('tradeNotification', (data) => {
    tradeNotification.set(data);
    
});

// Separate stores for different concerns
export const socketConnection = writable(null);
export const isConnected = writable(false);
export const orderBookData = writable(null);
export const tradeNotification = writable(null);

// Functions to control the connection
export const connectSocket = () => {
    socket.connect();
};
export const disconnectSocket = () => {
    socket.disconnect();
};
