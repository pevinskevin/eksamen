<script>
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
    import authStore from '../../store/authStore';
    import { disconnectSocket } from '../../store/socketStore';

    async function handleLogout() {
        try {
            const response = await fetch(`${apiBaseUrl}/logout`, {
                method: 'POST',
                credentials: 'include',
            });

            const responseData = await response.json();

            if (response.ok) {
                console.log(responseData.message);
                authStore.logout();
                disconnectSocket();
            } else console.log(responseData.errorMessage);
        } catch (error) {
            console.log(error);
        }
    }
</script>

<button on:click={handleLogout}>Logout</button>
