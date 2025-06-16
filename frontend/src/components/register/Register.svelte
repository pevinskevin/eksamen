<script>
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
    import { navigate } from 'svelte-routing';
    import { Button } from '$lib/components/ui/button';
    import * as Card from '$lib/components/ui/card';
    import { Input } from '$lib/components/ui/input';
    import { Label } from '$lib/components/ui/label';

    let firstName = '';
    let firstNameError = '';

    let lastName = '';
    let lastNameError = '';

    let email = 'example@test.com';
    let emailError = '';

    let password = '1234';
    let passwordError = '';

    let repeatPassword = '1234';
    let repeatPasswordError = '';

    function validateFirstName() {
        if (!firstName) {
            firstNameError = 'First name is required';
        } else {
            firstNameError = '';
        }
    }

    function validateLastName() {
        if (!lastName) {
            lastNameError = 'Last name is required';
        } else {
            lastNameError = '';
        }
    }

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

    function validateRepeatPassword() {
        if (!repeatPassword) {
            repeatPasswordError = 'Confirming your password is required.';
        } else if (password && password !== repeatPassword) {
            repeatPasswordError = 'Passwords do not match.';
        } else {
            repeatPasswordError = '';
        }
    }

    async function handleSubmit() {
        firstNameError = '';
        lastNameError = '';
        emailError = '';
        passwordError = '';
        repeatPasswordError = '';

        validateFirstName();
        validateLastName();
        validateEmail();
        validatePassword();
        validateRepeatPassword();

        if (
            !firstNameError &&
            !lastNameError &&
            !emailError &&
            !passwordError &&
            !repeatPasswordError
        ) {
            try {
                const response = await fetch(`${apiBaseUrl}/register`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        firstName,
                        lastName,
                        email,
                        password,
                        repeatPassword,
                    }),
                    credentials: 'include',
                });

                const responseData = await response.json();

                if (response.ok) {
                    navigate('/', { replace: true });
                } else {
                    console.log(responseData.error);
                }
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
        <Card.Title class="text-2xl">Create an account</Card.Title>
        <Card.Description>Enter your information to create an account.</Card.Description>
    </Card.Header>
    <form on:submit|preventDefault={handleSubmit}>
        <Card.Content class="grid gap-4">
            <div class="grid grid-cols-2 gap-4">
                <div class="grid gap-2">
                    <Label for="first-name">First name</Label>
                    <Input id="first-name" placeholder="Max" bind:value={firstName} />
                    {#if firstNameError}
                        <p class="text-sm font-medium text-destructive">{firstNameError}</p>
                    {/if}
                </div>
                <div class="grid gap-2">
                    <Label for="last-name">Last name</Label>
                    <Input id="last-name" placeholder="Robinson" bind:value={lastName} />
                    {#if lastNameError}
                        <p class="text-sm font-medium text-destructive">{lastNameError}</p>
                    {/if}
                </div>
            </div>
            <div class="grid gap-2">
                <Label for="email">Email</Label>
                <Input id="email" type="email" placeholder="m@example.com" bind:value={email} />
                {#if emailError}
                    <p class="text-sm font-medium text-destructive">{emailError}</p>
                {/if}
            </div>
            <div class="grid gap-2">
                <Label for="password">Password</Label>
                <Input id="password" type="password" bind:value={password} />
                {#if passwordError}
                    <p class="text-sm font-medium text-destructive">{passwordError}</p>
                {/if}
            </div>
            <div class="grid gap-2">
                <Label for="repeat-password">Repeat Password</Label>
                <Input id="repeat-password" type="password" bind:value={repeatPassword} />
                {#if repeatPasswordError}
                    <p class="text-sm font-medium text-destructive">{repeatPasswordError}</p>
                {/if}
            </div>
        </Card.Content>
        <Card.Footer>
            <Button type="submit" class="w-full">Create account</Button>
        </Card.Footer>
    </form>
</Card.Root>

<div class="mt-4 text-center text-sm">
    Already have an account? <a href="/" class="underline">Login</a>
</div>
