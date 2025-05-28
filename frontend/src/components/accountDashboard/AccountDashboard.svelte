<script>
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
    import { onMount } from 'svelte';
    import authStore from '../../store/authStore.js';

    let accountBalance = '';

    async function fetchAccountBalance() {
        try {
            const response = await fetch(`${apiBaseUrl}/account/balances`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
            });

            const responseData = await response.json();

            if (response.ok) {
                accountBalance = responseData.data;
            } else console.log(responseData.error);
        } catch (error) {
            console.log(error);
        }
    }

    onMount(() => {
        fetchAccountBalance();
    });
</script>

<h1>Welcome, user.</h1>

<h2>Account</h2>

<h4>Fiat Holdings</h4>
{#if accountBalance && accountBalance.account}
    <p>We have monies YAY! ٩(＾◡＾)۶</p>
    {#each accountBalance.account as fiatAccount}
        <p>{fiatAccount.currency_code}: {fiatAccount.balance}</p>
    {/each}
{:else}
    <p>Broke boi.</p>
{/if}

<h4>Cryptocurrency Holdings</h4>
{#if accountBalance && accountBalance.holdings}
    <p>We have cwypto YAY! ٩(＾◡＾)۶</p>
    {#each accountBalance.holdings as cryptoAccount}
        <p>{cryptoAccount.symbol}: {cryptoAccount.balance}</p>
    {/each}
{:else}
    <p>Broke boi.</p>
{/if}
