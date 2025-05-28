<script>
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
    import { onMount } from 'svelte';
    let cryptocurrenciesArray = '';

    async function getCryptocurrencies() {
        try {
            const response = await fetch(`${apiBaseUrl}/cryptocurrencies`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
            });

            const responseData = await response.json();

            if (response.ok) {
                cryptocurrenciesArray = responseData.data;
            } else console.log(responseData.error);
        } catch (error) {
            console.log('Error fetching data', error);
        }
    }

    onMount(() => {
        getCryptocurrencies();
    });
</script>

<h2>Available Cryptocurrencies</h2>

{#if cryptocurrenciesArray && cryptocurrenciesArray.length > 0}
    <div class="crypto-grid">
        {#each cryptocurrenciesArray as crypto}
            <div class="crypto-card">
                <div class="crypto-symbol">{crypto.symbol}</div>
                <div class="crypto-name">{crypto.name}</div>
            </div>
        {/each}
    </div>
{:else if cryptocurrenciesArray && cryptocurrenciesArray.length === 0}
    <p>No cryptocurrencies available.</p>
{:else}
    <p>Loading cryptocurrencies...</p>
{/if}

<style>
    .crypto-grid {
        /* Grid styling here */
    }

    .crypto-card {
        /* Card styling here */
    }

    .crypto-symbol {
        /* Symbol styling here */
    }

    .crypto-name {
        /* Name styling here */
    }
</style>
