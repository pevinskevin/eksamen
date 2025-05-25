<script>
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

    import Register from './components/register/Register.svelte';
    import Login from './components/login/Login.svelte';
    import AccountDashboard from './components/accountDashboard/AccountDashboard.svelte';
    import CryptocurrencyList from './components/cryptocurrencyList/CryptocurrencyList.svelte';
    import Logout from './components/logout/Logout.svelte';

    import authStore from './store/authStore';
</script>

{#if !$authStore.isAuthenticated}
    <Login></Login>
    <Register></Register>
{/if}

{#if $authStore.isAuthenticated}
    <AccountDashboard></AccountDashboard>
    <CryptocurrencyList></CryptocurrencyList>
    <Logout></Logout>
{/if}
