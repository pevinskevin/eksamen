<script>
    import { onMount } from 'svelte';
    import { Button } from '$lib/components/ui/button';
    import * as Card from '$lib/components/ui/card';
    import { Input } from '$lib/components/ui/input';
    import { Label } from '$lib/components/ui/label';
    import * as Select from '$lib/components/ui/select';
    import * as Table from '$lib/components/ui/table';
    import { orderBookData } from '../../store/socketStore.js';

    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
    let cryptocurrenciesArray = null;
    let selectedCryptoSymbol;
    let amount; // Use 'undefined' initial state for number input

    $: filteredOrderBook =
        $orderBookData && selectedCryptoSymbol
            ? $orderBookData[selectedCryptoSymbol + 'USDT']
            : null;
    $: triggerContent =
        cryptocurrenciesArray?.find((c) => c.symbol === selectedCryptoSymbol)?.name ??
        'Select a cryptocurrency';

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
                    <Select.Root type="single" bind:value={selectedCryptoSymbol}>
                        <Select.Trigger class="w-full">
                            {triggerContent}
                        </Select.Trigger>
                        <Select.Content>
                            <Select.Group>
                                <Select.Label>Available Cryptos</Select.Label>
                                {#each cryptocurrenciesArray as crypto}
                                    <Select.Item value={crypto.symbol} label={crypto.name}>
                                        {crypto.name} ({crypto.symbol})
                                    </Select.Item>
                                {/each}
                            </Select.Group>
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

{#if filteredOrderBook}
    <div class="mt-6">
        <h3 class="mb-4 text-lg font-semibold">Order Book for {selectedCryptoSymbol}</h3>
        <div class="grid grid-cols-2 gap-6">
            <div class="h-96 overflow-y-auto rounded-md border">
                <h4 class="sticky top-0 bg-background p-2 font-medium">Bids</h4>
                <Table.Root>
                    <Table.Header>
                        <Table.Row>
                            <Table.Head>Price (USDT)</Table.Head>
                            <Table.Head>Amount</Table.Head>
                        </Table.Row>
                    </Table.Header>
                    <Table.Body>
                        {#each filteredOrderBook.bids as [price, amount]}
                            <Table.Row>
                                <Table.Cell>{price}</Table.Cell>
                                <Table.Cell>{amount}</Table.Cell>
                            </Table.Row>
                        {/each}
                    </Table.Body>
                </Table.Root>
            </div>
            <div class="h-96 overflow-y-auto rounded-md border">
                <h4 class="sticky top-0 bg-background p-2 font-medium">Asks</h4>
                <Table.Root>
                    <Table.Header>
                        <Table.Row>
                            <Table.Head>Price (USDT)</Table.Head>
                            <Table.Head>Amount</Table.Head>
                        </Table.Row>
                    </Table.Header>
                    <Table.Body>
                        {#each filteredOrderBook.asks as [price, amount]}
                            <Table.Row>
                                <Table.Cell>{price}</Table.Cell>
                                <Table.Cell>{amount}</Table.Cell>
                            </Table.Row>
                        {/each}
                    </Table.Body>
                </Table.Root>
            </div>
        </div>
    </div>
{/if}
