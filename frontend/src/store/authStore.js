import { writable, get } from 'svelte/store';

// Initial state for the store
const initialAuthState = {
    isAuthenticated: false,
    user: null, // This will hold user details like { id, email, role } when logged in
};

// Create the writable store
const authStore = writable(initialAuthState);

// Optional: Export custom functions to interact with the store in a more controlled way
// This is good practice as your store logic grows.

export default {
    subscribe: authStore.subscribe, // Expose the subscribe method for components to listen to changes

    // Function to call upon successful login
    login: (userData) => {
        authStore.set({
            isAuthenticated: true,
            user: {
                id: userData.userId, // Assuming userData comes from your API response
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
    logout: () => {
        authStore.set({
            isAuthenticated: false,
            user: null,
        });
        // Also clear any localStorage if you used it
        // And importantly, you'd typically also make an API call to your backend's
        // /api/logout endpoint here to destroy the server-side session.
    },

    // You could add a function to initialize the store from sessionStorage/localStorage
    // if you were persisting parts of the auth state there for page reloads.
    // For now, we'll keep it simple.

    accessUserId: () => {
        const state = get(authStore);
        return state.user ? state.user.id : null;
    },
};
