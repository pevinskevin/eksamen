<script>
    import Input from "$lib/components/ui/input/input.svelte";
    import Label from "$lib/components/ui/label/label.svelte";
    import * as Card from '$lib/components/ui/card';


    let depositAmount;

    async function handleDeposit(amount) {
        const response = await fetch('http://localhost:8080/api/deposits/create-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ amount }),
        });

        const { url } = await response.json();
        window.location.href = url;
    }
</script>



<!-- <Card.Root>
    <Card.Header>

    </Card.Header>
    <Card.Content>
        <form on:submit|preventDefault={handleDeposit}>
<Label class="deposit">Deposit fiat</Label>
<Input type="number" bind:value={depositAmount}>
</form>
    </Card.Content>

</Card.Root> -->
