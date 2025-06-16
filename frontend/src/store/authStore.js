import { writable, get } from 'svelte/store';

// Helper to safely access localStorage
const getStorage = () => {
    if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage;
    }
    // Return a dummy storage object if localStorage is not available (e.g., during SSR)
    return {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {},
    };
};

const storage = getStorage();

// Load initial state from localStorage if it exists
const storedAuth = storage.getItem('auth');
const initialAuthState = storedAuth
    ? JSON.parse(storedAuth)
    : {
          isAuthenticated: false,
          user: null, // This will hold user details like { id, email, role }
      };

// Create the writable store with the potentially persisted state
const authStore = writable(initialAuthState);

// Whenever the store changes, update localStorage
authStore.subscribe((value) => {
    if (value.isAuthenticated) {
        storage.setItem('auth', JSON.stringify(value));
    } else {
        storage.removeItem('auth');
    }
});

// Optional: Export custom functions to interact with the store in a more controlled way
// This is good practice as your store logic grows.

export default {
    subscribe: authStore.subscribe, // Expose the subscribe method for components to listen to changes

    // Function to call upon successful login
    login: (userData) => {
        authStore.set({
            isAuthenticated: true,
            user: {
                id: userData.id, // Ensure you are passing the full user object
                email: userData.email,
                role: userData.role,
            },
        });
        // You could also store something in localStorage here if you want to persist login
        // across browser sessions/refreshes, though session cookies often handle this.
        // For a simple session-based auth, just updating the store might be enough
        // if the server session is the source of truth.
    },

    // Function to call upon logout
    logout: async () => {
        // You would typically make an API call to the backend here
        // await fetch('/api/logout', { method: 'POST' });

        authStore.set({
            isAuthenticated: false,
            user: null,
        });
    },

    // You could add a function to initialize the store from sessionStorage/localStorage
    // if you were persisting parts of the auth state there for page reloads.
    // For now, we'll keep it simple.

    accessUserId: () => {
        const state = get(authStore);
        return state.user ? state.user.id : null;
    },
};
