<script>
    import { onMount } from 'svelte';
    import { Button } from '$lib/components/ui/button';
    import * as Card from '$lib/components/ui/card';
    import { Input } from '$lib/components/ui/input';
    import { Label } from '$lib/components/ui/label';
    import * as Select from '$lib/components/ui/select';
    import { orderBookData } from '../../store/socketStore.js';

    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
    let cryptocurrenciesArray = null;
    let selectedCryptoSymbol;
    let amount; // Use 'undefined' initial state for number input

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
                cryptocurrenciesArray = responseData;
                if (cryptocurrenciesArray && cryptocurrenciesArray.length > 0) {
                    selectedCryptoSymbol = cryptocurrenciesArray[0].symbol;
                }
            } else console.log(responseData.error);
        } catch (error) {
            console.log('Error fetching data', error);
        }
    }

    function handleSelectedCryptocurrency() {}

    onMount(() => {
        getCryptocurrencies();
    });
</script>

<Card.Root>
    <Card.Header>
        <Card.Title>Trade Assets</Card.Title>
        <Card.Description>Buy or sell cryptocurrencies.</Card.Description>
    </Card.Header>
    <Card.Content class="grid gap-4">
        <div class="grid gap-2">
            <Label for="crypto-select">Cryptocurrency</Label>
            {#if cryptocurrenciesArray}
                {#if cryptocurrenciesArray.length > 0}
                    <Select.Root bind:value={selectedCryptoSymbol}>
                        <Select.Trigger class="w-full">
                            <Select.Value placeholder="Select a cryptocurrency" />
                        </Select.Trigger>
                        <Select.Content>
                            {#each cryptocurrenciesArray as crypto}
                                <Select.Item value={crypto.symbol} label={crypto.name}>
                                    {crypto.name} ({crypto.symbol})
                                </Select.Item>
                            {/each}
                        </Select.Content>
                    </Select.Root>
                {:else}
                    <p class="text-sm text-muted-foreground">No cryptocurrencies available.</p>
                {/if}
            {:else}
                <p class="text-sm text-muted-foreground">Loading cryptocurrencies...</p>
            {/if}
        </div>
        <div class="grid gap-2">
            <Label for="amount">Amount</Label>
            <Input id="amount" type="number" placeholder="0.00" bind:value={amount} />
        </div>
    </Card.Content>
    <Card.Footer class="flex justify-between">
        <Button
            on:click={() => handleTrade('buy')}
            class="w-[48%] bg-green-500 text-primary-foreground hover:bg-green-600"
            disabled={!selectedCryptoSymbol || !amount || amount <= 0}>Buy</Button
        >
        <Button
            on:click={() => handleTrade('sell')}
            variant="destructive"
            class="w-[48%]"
            disabled={!selectedCryptoSymbol || !amount || amount <= 0}>Sell</Button
        >
    </Card.Footer>
</Card.Root>
