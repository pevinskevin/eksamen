<script>
    import { Button } from '$lib/components/ui/button';
    import * as Card from '$lib/components/ui/card';
    import { Input } from '$lib/components/ui/input';
    import { Label } from '$lib/components/ui/label';
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
    import authStore from '../../store/authStore.js';
    import { connectSocket } from '../../store/socketStore.js';
    import { navigate } from 'svelte-routing';

    let email = 'admin@test.com';
    let emailError = '';

    let password = 'test1234';
    let passwordError = '';

    function validateEmail() {
        if (!email) {
            emailError = 'Email is required';
        } else if (!email.includes('@') || !email.includes('.')) {
            emailError = 'Please enter a valid email address.';
        } else {
            emailError = '';
        }
    }

    function validatePassword() {
        if (!password) {
            passwordError = 'Password is required.';
        } else {
            passwordError = '';
        }
    }

    async function handleSubmit() {
        emailError = '';
        passwordError = '';

        validateEmail();
        validatePassword();

        if (!emailError && !passwordError) {
            console.log('Login form is valid', email, password);
            console.log('Login form submitted!');

            try {
                const response = await fetch(`${apiBaseUrl}/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email: email, password: password }),
                    credentials: 'include',
                });

                const responseData = await response.json();

                if (response.ok) {
                    authStore.login(responseData);
                    connectSocket();
                    navigate('/dashboard', { replace: true });
                } else console.log(responseData.error);
            } catch (error) {
                console.log(error);
            }
        } else {
            console.log('Form has errors.');
        }
    }
</script>

<Card.Root class="mx-auto mt-10 w-[400px]">
    <Card.Header class="space-y-1">
        <Card.Title class="text-2xl">Login to your account</Card.Title>
        <Card.Description class="">Enter your email and password to login.</Card.Description>
    </Card.Header>
    <form on:submit|preventDefault={handleSubmit}>
        <Card.Content class="grid gap-4">
            <div class="grid gap-2">
                <Label for="email" class="">Email</Label>
                <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    bind:value={email}
                    class=""
                />
                {#if emailError}
                    <p class="text-sm font-medium text-destructive">{emailError}</p>
                {/if}
            </div>
            <div class="grid gap-2">
                <Label for="password" class="">Password</Label>
                <Input id="password" type="password" bind:value={password} class="" />
                {#if passwordError}
                    <p class="text-sm font-medium text-destructive">{passwordError}</p>
                {/if}
            </div>
        </Card.Content>
        <Card.Footer class="">
            <Button type="submit" class="w-full" disabled={false}>Login</Button>
        </Card.Footer>
    </form>
</Card.Root>

<div class="mt-4 text-center text-sm">
    <p>Don't have an account? <a href="/register" class="underline">Sign up</a></p>
    <p class="mt-2">
        <a href="/forgot-password" class="underline">Forgot your password?</a>
    </p>
</div>
