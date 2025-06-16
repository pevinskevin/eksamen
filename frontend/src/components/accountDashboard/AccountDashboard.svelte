<script>
    import { onMount } from 'svelte';
    import authStore from '../../store/authStore.js';
    import * as Card from '$lib/components/ui/card';
    import * as Table from '$lib/components/ui/table';

    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

    let accountBalance = null;

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
                accountBalance = responseData;
            } else console.log(responseData.error);
        } catch (error) {
            console.log(error);
        }
    }

    onMount(() => {
        fetchAccountBalance();
    });
</script>

<div class="space-y-4">
    <h1 class="text-3xl font-bold">Welcome, user.</h1>

    <div class="grid gap-4 md:grid-cols-2">
        <Card.Root>
            <Card.Header>
                <Card.Title>Fiat Balance</Card.Title>
                <Card.Description>Your cash holdings.</Card.Description>
            </Card.Header>
            <Card.Content>
                <Table.Root>
                    <Table.Header>
                        <Table.Row>
                            <Table.Head>Currency</Table.Head>
                            <Table.Head class="text-right">Balance</Table.Head>
                        </Table.Row>
                    </Table.Header>
                    <Table.Body>
                        {#if accountBalance && accountBalance.fiatAccount}
                            <Table.Row>
                                <Table.Cell class="font-medium"
                                    >{accountBalance.fiatAccount.currencyCode}</Table.Cell
                                >
                                <Table.Cell class="text-right"
                                    >{accountBalance.fiatAccount.balance}</Table.Cell
                                >
                            </Table.Row>
                        {:else}
                            <Table.Row>
                                <Table.Cell colspan="2" class="h-24 text-center"
                                    >No fiat balance found.</Table.Cell
                                >
                            </Table.Row>
                        {/if}
                    </Table.Body>
                </Table.Root>
            </Card.Content>
        </Card.Root>

        <Card.Root>
            <Card.Header>
                <Card.Title>Cryptocurrency Holdings</Card.Title>
                <Card.Description>Your digital asset portfolio.</Card.Description>
            </Card.Header>
            <Card.Content>
                <Table.Root>
                    <Table.Header>
                        <Table.Row>
                            <Table.Head>Asset</Table.Head>
                            <Table.Head class="text-right">Balance</Table.Head>
                        </Table.Row>
                    </Table.Header>
                    <Table.Body>
                        {#if accountBalance && accountBalance.cryptoHoldings && accountBalance.cryptoHoldings.length > 0}
                            {#each accountBalance.cryptoHoldings as cryptoAccount}
                                <Table.Row>
                                    <Table.Cell class="font-medium"
                                        >{cryptoAccount.symbol}</Table.Cell
                                    >
                                    <Table.Cell class="text-right"
                                        >{cryptoAccount.balance}</Table.Cell
                                    >
                                </Table.Row>
                            {/each}
                        {:else}
                            <Table.Row>
                                <Table.Cell colspan="2" class="h-24 text-center"
                                    >No cryptocurrency assets found.</Table.Cell
                                >
                            </Table.Row>
                        {/if}
                    </Table.Body>
                </Table.Root>
            </Card.Content>
        </Card.Root>
    </div>
</div>
