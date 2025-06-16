<script>
    import Login from '../components/login/Login.svelte';
    import { navigate } from 'svelte-routing';
    import authStore from '../store/authStore';
    import { onMount } from 'svelte';

    function handleRedirectToRegister() {
        navigate('/register', { replace: true });
    }
    function handleRedirectToResetPassword() {
        navigate('/reset-password', { replace: true });
    }
    function handleRedirectToDashboard() {
        navigate('/dashboard', { replace: true });
    }

    $: if ($authStore.isAuthenticated) {
        handleRedirectToDashboard();
    }
</script>

<Login></Login>
