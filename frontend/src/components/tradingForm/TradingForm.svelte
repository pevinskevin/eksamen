<script>
    import { onMount } from 'svelte';
    import { toast } from 'svelte-sonner';
    import { Button, buttonVariants } from '$lib/components/ui/button';
    import * as Card from '$lib/components/ui/card';
    import { Input } from '$lib/components/ui/input';
    import { Label } from '$lib/components/ui/label';
    import * as Select from '$lib/components/ui/select';
    import * as Table from '$lib/components/ui/table';
    import { orderBookData } from '../../store/socketStore.js';

    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
    let cryptocurrenciesArray = null;
    let selectedCryptoSymbol;
    let buyAmount;
    let sellAmount;

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

    onMount(() => {
        getCryptocurrencies();
    });

    async function handleTrade(side, amount) {
        if (!selectedCryptoSymbol || !amount || amount <= 0) {
            toast.error('Please select a cryptocurrency and enter a valid amount.');
            return;
        }

        const crypto = cryptocurrenciesArray.find((c) => c.symbol === selectedCryptoSymbol);
        if (!crypto) {
            toast.error('Selected cryptocurrency is not valid.');
            return;
        }

        const body = {
            cryptocurrencyId: crypto.id,
            orderVariant: side,
            initialQuantity: side === 'sell' ? amount.toString() : '0',
            notionalValue: side === 'buy' ? amount.toString() : '0',
        };

        try {
            const response = await fetch(`${apiBaseUrl}/order/market`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(body),
            });

            if (response.ok) {
                const responseData = await response.json();
                toast.success(
                    `Market ${side} order for ${
                        side === 'buy' ? `$${amount}` : `${amount} ${selectedCryptoSymbol}`
                    } placed successfully.`,
                );
                if (side === 'buy') {
                    buyAmount = undefined;
                } else {
                    sellAmount = undefined;
                }
            } else {
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    const errorData = await response.json();
                    toast.error(`Order failed: ${errorData.message || 'Unknown error'}`);
                } else {
                    const errorText = await response.text();
                    toast.error(
                        `Order failed: ${response.status} ${response.statusText} - ${errorText}`,
                    );
                }
            }
        } catch (error) {
            toast.error('An error occurred while placing the order.');
            console.error('Error placing order:', error);
        }
    }
</script>

<div class="w-full">
    <div class="grid w-full max-w-sm gap-2 mb-6">
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

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card.Root>
            <Card.Header>
                <Card.Title>Buy Crypto</Card.Title>
                <Card.Description>Buy with USD</Card.Description>
            </Card.Header>
            <Card.Content class="grid gap-4">
                <div class="grid gap-2">
                    <Label for="buy-amount">Amount (USD)</Label>
                    <Input
                        id="buy-amount"
                        type="number"
                        placeholder="100.00"
                        bind:value={buyAmount}
                    />
                </div>
            </Card.Content>
            <Card.Footer>
                <button
                    class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2 w-full bg-green-500 text-primary-foreground hover:bg-green-600"
                    on:click={() => handleTrade('buy', buyAmount)}
                    disabled={!selectedCryptoSymbol || !buyAmount || buyAmount <= 0}>Buy</button
                >
            </Card.Footer>
        </Card.Root>

        <Card.Root>
            <Card.Header>
                <Card.Title>Sell Crypto</Card.Title>
                <Card.Description
                    >Sell for {selectedCryptoSymbol
                        ? selectedCryptoSymbol
                        : 'Crypto'}</Card.Description
                >
            </Card.Header>
            <Card.Content class="grid gap-4">
                <div class="grid gap-2">
                    <Label for="sell-amount"
                        >Amount ({selectedCryptoSymbol ? selectedCryptoSymbol : 'Crypto'})</Label
                    >
                    <Input
                        id="sell-amount"
                        type="number"
                        placeholder="0.05"
                        bind:value={sellAmount}
                    />
                </div>
            </Card.Content>
            <Card.Footer>
                <button
                    class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2 w-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    on:click={() => handleTrade('sell', sellAmount)}
                    disabled={!selectedCryptoSymbol || !sellAmount || sellAmount <= 0}>Sell</button
                >
            </Card.Footer>
        </Card.Root>
    </div>
</div>

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
