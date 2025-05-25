<script>
    import { onMount } from 'svelte';
    const baseUrl = import.meta.env.VITE_API_BASE_URL;
    import authStore from '../../store/authStore.js';

    let accountBalance = '';

    async function fetchAccountBalance() {
        try {
            const response = await fetch(`${baseUrl}/api/account/balances`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
            });

            const responseData = await response.json();

            if (response.ok) {
                console.log(responseData.message, responseData.data);
                accountBalance = responseData.data;
            } else console.log(responseData.error);
        } catch (error) {
            console.log(error);
        }
    }


    

    onMount(() => {
        fetchAccountBalance();
        console.log(accountBalance);
    });
</script>

<h1>Welcome, user.</h1>

<h2>Account</h2>

<h4>Fiat Holdings</h4>


<h4>Cryptocurrency Holdings</h4>
