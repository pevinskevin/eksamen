<script>
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
    const exchangeWalletAddress = import.meta.env.VITE_EXCHANGE_WALLET_ADDRESS;
    const exchangeWalletPrivateKey = import.meta.env.VITE_EXCHANGE_WALLET_PRIVATE_KEY;
    const jsonRpcProviderUrl = import.meta.env.VITE_JSON_RPC_PROVIDER_URL;

    import Input from '$lib/components/ui/input/input.svelte';
    import Label from '$lib/components/ui/label/label.svelte';
    import { Button } from '$lib/components/ui/button';
    import * as Card from '$lib/components/ui/card';
    import { navigate } from 'svelte-routing';
    import { ethers } from 'ethers';
    let depositAmount;
    let withdrawalAmount;
    let userAddress;

    // Metamask config.

    // Ethers.js instances for programmatic withdrawal
    let provider;
    let exchangeSignerWallet; // Wallet object for the exchange, created from private key

    // Initialize Exchange Wallet for programmatic signing
    if (exchangeWalletPrivateKey && jsonRpcProviderUrl) {
        try {
            provider = new ethers.JsonRpcProvider(jsonRpcProviderUrl);
            exchangeSignerWallet = new ethers.Wallet(exchangeWalletPrivateKey, provider);
        } catch (e) {
            console.error('Failed to initialize programmatic exchange wallet:', e);
            exchangeSignerWallet = null; // Ensure it's null if setup fails
        }
    } else {
        console.warn(
            'Exchange wallet private key or RPC URL missing. Programmatic withdrawals disabled.',
        );
    }

    async function connectWallet() {
        if (!userAddress) {
            const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
            userAddress = accounts[0];
        } else return;
    }

    async function removeUserWalletAddress() {
        userAddress = null;
    }

    async function depositETH(amountInEth) {

        try {

            const amountWei = ethers.parseUnits(amountInEth.toString(), 'ether');
            const txHash = await window.ethereum.request({
                method: 'eth_sendTransaction',
                params: [
                    {
                        from: userAddress,
                        to: exchangeWalletAddress,
                        value: '0x' + amountWei.toString(16),
                        chainId: 1337,
                    },
                ],
            });

            return true;
        } catch (error) {
            console.error('Deposit error:', error);
            return false;
        }
    }

    async function withdrawETH(amountInEth) {
        const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
        try {
            const amountWei = ethers.parseUnits(amountInEth.toString(), 'ether');
            const tx = {
                to: userAddress,
                value: amountWei,
                chainId: 1337,
                gasLimit: 21000,
            };
            const txResponse = await exchangeSignerWallet.sendTransaction(tx);

            const receipt = await txResponse.wait(); // Wait for 1 confirmation
        } catch (error) {
            console.error('Withdrawal error:', error);
        }
    }

    async function handleDeposit(amount) {
        try {
            await connectWallet();
            const deposit = await depositETH(amount);
            if (!deposit) throw new Error('Deposit failed.');
            await removeUserWalletAddress();
            const response = await fetch('http://localhost:8080/api/account/deposit/crypto', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ amount: amount.toString() }),
            });
            navigate('/dashboard', { replace: true });
        } catch (error) {
            console.log(error);
        }
    }

    async function handleWithdrawal(amount) {
        await connectWallet();
        await withdrawETH(amount);
        await removeUserWalletAddress();
        const response = await fetch('http://localhost:8080/api/account/withdrawal/crypto', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ amount: amount.toString() }),
        });
        navigate('/dashboard', { replace: true });
    }
</script>

<Card.Root class="w-full max-w-md mx-auto">
    <Card.Header class="space-y-1">
        <Card.Title class="text-2xl font-bold">Deposit ETH</Card.Title>
        <Card.Description>Press the button below to deposit ETH</Card.Description>
    </Card.Header>
    <Card.Content class="space-y-4">
        <form on:submit|preventDefault={() => handleDeposit(depositAmount)} class="space-y-4">
            <div class="space-y-2">
                <Label for="amount">Amount (ETH)</Label>
                <Input
                    id="amount"
                    type="number"
                    bind:value={depositAmount}
                    placeholder="Enter amount in ETH"
                    min="0.001"
                    step="0.001"
                    required
                />
            </div>
            <Button class="w-full" type="submit">Deposit Funds</Button>
        </form>
    </Card.Content>
</Card.Root>

<Card.Root class="w-full max-w-md mx-auto">
    <Card.Header class="space-y-1">
        <Card.Title class="text-2xl font-bold">Withdraw ETH</Card.Title>
        <Card.Description>Press the button below to withdraw ETH</Card.Description>
    </Card.Header>
    <Card.Content class="space-y-4">
        <form on:submit|preventDefault={() => handleWithdrawal(withdrawalAmount)} class="space-y-4">
            <div class="space-y-2">
                <Label for="amount">Amount (ETH)</Label>
                <Input
                    id="amount"
                    type="number"
                    bind:value={withdrawalAmount}
                    placeholder="Enter amount in ETH"
                    min="0.001"
                    step="0.001"
                    required
                />
            </div>
            <Button class="w-full" type="submit">Withdraw Funds</Button>
        </form>
    </Card.Content>
</Card.Root>
