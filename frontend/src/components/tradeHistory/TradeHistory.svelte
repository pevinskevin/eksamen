<script>
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
    import { onMount } from 'svelte';

    import * as Card from '$lib/components/ui/card';
    import * as Table from '$lib/components/ui/table';

    let tradesArray = [];
    let error = null;

    async function fetchTrades() {
        try {
            const response = await fetch(`${apiBaseUrl}/trades`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.message || 'Failed to fetch trades');
            }

            tradesArray = await response.json();
        } catch (e) {
            error = e.message;
            console.error(e);
        }
    }

    onMount(() => {
        fetchTrades();
    });
</script>

<Card.Root class="w-full max-w-4xl mx-auto mt-8">
    <Card.Header>
        <Card.Title>Trade History</Card.Title>
        <Card.Description>A record of your recent trades.</Card.Description>
    </Card.Header>
    <Card.Content>
        {#if error}
            <p class="text-red-500">{error}</p>
        {:else if tradesArray.length > 0}
            <Table.Root>
                <Table.Header>
                    <Table.Row>
                        <Table.Head class="w-[180px]">Date</Table.Head>
                        <Table.Head>Asset</Table.Head>
                        <Table.Head>Type</Table.Head>
                        <Table.Head class="text-right">Quantity</Table.Head>
                        <Table.Head class="text-right">Price</Table.Head>
                    </Table.Row>
                </Table.Header>
                <Table.Body>
                    {#each tradesArray as trade (trade.id)}
                        <Table.Row>
                            <Table.Cell>
                                {new Date(trade.tradeTimestamp).toLocaleString()}
                            </Table.Cell>
                            <Table.Cell>{trade.symbol}</Table.Cell>
                            <Table.Cell class="font-medium capitalize">
                                {trade.type}
                            </Table.Cell>
                            <Table.Cell class="text-right">{trade.quantity}</Table.Cell>
                            <Table.Cell class="text-right">{trade.price}</Table.Cell>
                        </Table.Row>
                    {/each}
                </Table.Body>
            </Table.Root>
        {:else}
            <p>No trades found.</p>
        {/if}
    </Card.Content>
</Card.Root>
