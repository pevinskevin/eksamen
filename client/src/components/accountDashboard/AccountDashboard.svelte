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
