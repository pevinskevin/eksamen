<script>
    const baseUrl = import.meta.env.VITE_API_BASE_URL;
    import Register from './components/register/Register.svelte';
    import Login from './components/login/Login.svelte';
    import AccountDashboard from './components/accountDashboard/AccountDashboard.svelte';

    import authStore from './store/authStore';
    import { disconnectSocket } from './store/socketStore';

    async function handleLogout() {
        try {
            const response = await fetch(`${baseUrl}/api/logout`, {
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

{#if !$authStore.isAuthenticated}
    <Login></Login>
    <Register></Register>
{/if}

{#if $authStore.isAuthenticated}
    <AccountDashboard></AccountDashboard>
    <button on:click={handleLogout}>Logout</button>
{/if}
