<script>
    import { buttonVariants } from '$lib/components/ui/button';
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
    import authStore from '../../store/authStore';
    import { disconnectSocket } from '../../store/socketStore';
    import { navigate } from 'svelte-routing';

    async function handleLogout() {
        try {
            const response = await fetch(`${apiBaseUrl}/logout`, {
                method: 'POST',
                credentials: 'include',
            });

            const responseData = await response.json();

            if (response.ok) {
                authStore.logout();
                disconnectSocket();
                navigate('/', { replace: true });
            } else console.log(responseData.error);
        } catch (error) {
            console.log(error);
        }
    }
</script>

<button class={buttonVariants()} on:click={handleLogout}>Logout</button>
