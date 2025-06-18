<script>
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
    import { navigate } from 'svelte-routing';
    import { Button } from '$lib/components/ui/button';
    import * as Card from '$lib/components/ui/card';
    import { Input } from '$lib/components/ui/input';
    import { Label } from '$lib/components/ui/label';
    let email = 'example@test.com';
    let emailError = '';

    function validateEmail() {
        if (!email) {
            emailError = 'Email is required';
        } else if (!email.includes('@') || !email.includes('.')) {
            emailError = 'Please enter a valid email address.';
        } else {
            emailError = '';
        }
    }

    async function handleResetPasswordSubmission() {
        try {
            validateEmail();
            const response = await fetch(`${apiBaseUrl}/reset-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
                credentials: 'include',
            });
            const responseData = await response.json();

            if (response.ok) {
                const message = responseData.message;
                navigate('/', { replace: true });
            } else {
                console.log(responseData);
            }
        } catch (error) {
            console.log('Error: ' + error.message);
        }
    }
</script>

<Card.Root class="mx-auto mt-10 w-[400px]">
    <Card.Header class="space-y-1">
        <Card.Title class="text-2xl">Reset your password</Card.Title>
        <Card.Description>
            Enter your email address and we will send you a link to reset your password.
        </Card.Description>
    </Card.Header>
    <form on:submit|preventDefault={handleResetPasswordSubmission}>
        <Card.Content class="grid gap-4">
            <div class="grid gap-2">
                <Label for="email">Email</Label>
                <Input id="email" type="email" placeholder="name@example.com" bind:value={email} />
                {#if emailError}
                    <p class="text-sm font-medium text-destructive">{emailError}</p>
                {/if}
            </div>
        </Card.Content>
        <Card.Footer>
            <Button type="submit" class="w-full">Submit</Button>
        </Card.Footer>
    </form>
</Card.Root>

<div class="mt-4 text-center text-sm">
    <a href="/" class="underline">Back to login</a>
</div>
