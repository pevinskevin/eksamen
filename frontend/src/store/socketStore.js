import { writable } from 'svelte/store';
import { io } from 'socket.io-client';
const socketUrl = import.meta.env.VITE_SOCKET_URL;
import authStore from './authStore';

const socket = io(`${socketUrl}`, { autoConnect: false });

socket.on('connect', () => {
    console.log('Connected to server.');
    socketConnection.set(socket);
    isConnected.set(true);
    const userId = `user_${authStore.accessUserId()}`;
    socket.emit('joinRoom', userId);
});

socket.on('disconnect', () => {
    console.log('Disconnected from server.');
    isConnected.set(false);
});

socket.on('orderBookUpdate', (data) => {
    orderBookData.set(data);
});

socket.on('tradeNotification', (data) => {
    tradeNotification.set(data);
    console.log(data);
    
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
