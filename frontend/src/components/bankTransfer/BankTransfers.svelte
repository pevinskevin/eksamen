<script>
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

    import Input from '$lib/components/ui/input/input.svelte';
    import Label from '$lib/components/ui/label/label.svelte';
    import { Button } from '$lib/components/ui/button';
    import * as Card from '$lib/components/ui/card';
    import { navigate } from 'svelte-routing';
    let depositAmount;
    let withdrawalAmount;

    async function handleDeposit(amount) {
        const response = await fetch('http://localhost:8080/api/account/deposit/fiat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ amount }),
        });

        const { url } = await response.json();
        window.location.href = url;
    }

    async function handleWithdrawal(amount) {
        const response = await fetch('http://localhost:8080/api/account/withdrawal/fiat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ amount }),
        });
        const responseData = await response.json();

        if (response.ok) {
            alert('Withdrawal successful');
            navigate('/dashboard', { replace: true });
        } else {
            alert(responseData.message);
        }

        navigate('/dashboard', { replace: true });
    }
</script>

<Card.Root class="w-full max-w-md mx-auto">
    <Card.Header class="space-y-1">
        <Card.Title class="text-2xl font-bold">Deposit Funds</Card.Title>
        <Card.Description>Enter the amount you wish to deposit in USD</Card.Description>
    </Card.Header>
    <Card.Content class="space-y-4">
        <form on:submit|preventDefault={() => handleDeposit(depositAmount)} class="space-y-4">
            <div class="space-y-2">
                <Label for="amount">Amount (USD)</Label>
                <Input
                    id="amount"
                    type="number"
                    bind:value={depositAmount}
                    placeholder="Enter amount in USD"
                    min="1"
                    step="0.01"
                    required
                />
            </div>
            <Button class="w-full" type="submit">Deposit Funds</Button>
        </form>
    </Card.Content>
</Card.Root>

<Card.Root class="w-full max-w-md mx-auto">
    <Card.Header class="space-y-1">
        <Card.Title class="text-2xl font-bold">Withdraw Funds</Card.Title>
        <Card.Description>Enter the amount you wish to withdraw in USD</Card.Description>
    </Card.Header>
    <Card.Content class="space-y-4">
        <form on:submit|preventDefault={() => handleWithdrawal(withdrawalAmount)} class="space-y-4">
            <div class="space-y-2">
                <Label for="amount">Amount (USD)</Label>
                <Input
                    id="amount"
                    type="number"
                    bind:value={withdrawalAmount}
                    placeholder="Enter amount in USD"
                    min="1"
                    step="0.01"
                    required
                />
            </div>
            <Button class="w-full" type="submit">Withdraw Funds</Button>
        </form>
    </Card.Content>
</Card.Root>
