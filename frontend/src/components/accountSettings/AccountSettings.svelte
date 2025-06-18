<script>
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

    import Input from '$lib/components/ui/input/input.svelte';
    import Label from '$lib/components/ui/label/label.svelte';
    import { Button } from '$lib/components/ui/button';
    import * as Card from '$lib/components/ui/card';

    let firstName = '';
    let lastName = '';
    let email = '';
    let password = '';
    let repeatPassword = '';

    let firstNameError = '';
    let lastNameError = '';
    let emailError = '';
    let passwordError = '';
    let repeatPasswordError = '';
    let generalError = '';
    let successMessage = '';

    async function handleUpdate() {
        // Reset previous errors and success messages
        firstNameError =
            lastNameError =
            emailError =
            passwordError =
            repeatPasswordError =
            generalError =
            successMessage =
                '';

        let isNameTouched = firstName || lastName;
        let isEmailTouched = email;
        let isPasswordTouched = password || repeatPassword;

        if (isNameTouched) {
            firstNameError = !firstName ? 'First name is required to update name.' : '';
            lastNameError = !lastName ? 'Last name is required to update name.' : '';
        }

        if (isEmailTouched) {
            if (!email.includes('@') || !email.includes('.')) {
                emailError = 'Please enter a valid email address.';
            }
        }

        if (isPasswordTouched) {
            passwordError = !password ? 'New password is required.' : '';
            repeatPasswordError = !repeatPassword ? 'Please confirm your new password.' : '';
            if (password && repeatPassword && password !== repeatPassword) {
                repeatPasswordError = 'Passwords do not match.';
            }
        }

        if (firstNameError || lastNameError || emailError || passwordError || repeatPasswordError) {
            return;
        }

        // Build the payload with only the fields that the user wants to update
        const payload = {};
        if (isNameTouched && !firstNameError && !lastNameError) {
            payload.firstName = firstName;
            payload.lastName = lastName;
        }
        if (isEmailTouched && !emailError) {
            payload.email = email;
        }
        if (isPasswordTouched && !passwordError && !repeatPasswordError) {
            payload.password = password;
        }

        // Check if there is anything to update
        if (Object.keys(payload).length === 0) {
            generalError = 'Please fill out at least one section to update your account.';
            return;
        }

        try {
            const response = await fetch(`${apiBaseUrl}/account`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(payload),
            });

            const responseData = await response.json();

            if (response.ok) {
                successMessage = 'Your account has been updated successfully!';
                firstName = lastName = email = password = repeatPassword = '';
            } else {
                generalError = responseData.message || 'An unknown error occurred.';
            }
        } catch (error) {
            generalError = 'Failed to connect to the server. Please try again later.';
            console.error(error);
        }
    }
</script>

<Card.Root class="w-full max-w-2xl mx-auto mt-8">
    <Card.Header>
        <Card.Title>Account Settings</Card.Title>
        <Card.Description>
            Update your personal information. Only filled sections will be updated.
        </Card.Description>
    </Card.Header>
    <Card.Content>
        <form on:submit|preventDefault={handleUpdate} class="space-y-6">
            <!-- Update Name Section -->
            <fieldset class="space-y-4 p-4 border rounded-md">
                <legend class="text-lg font-medium px-1">Update Name</legend>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <Label for="firstName" class="mb-1 block">First Name</Label>
                        <Input
                            id="firstName"
                            bind:value={firstName}
                            placeholder="John"
                            type="text"
                        />
                        {#if firstNameError}<p class="text-red-500 text-sm mt-1">
                                {firstNameError}
                            </p>{/if}
                    </div>
                    <div>
                        <Label for="lastName" class="mb-1 block">Last Name</Label>
                        <Input id="lastName" bind:value={lastName} placeholder="Doe" type="text" />
                        {#if lastNameError}<p class="text-red-500 text-sm mt-1">
                                {lastNameError}
                            </p>{/if}
                    </div>
                </div>
            </fieldset>

            <!-- Update Email Section -->
            <fieldset class="space-y-4 p-4 border rounded-md">
                <legend class="text-lg font-medium px-1">Update Email</legend>
                <div>
                    <Label for="email" class="mb-1 block">Email Address</Label>
                    <Input
                        id="email"
                        type="email"
                        bind:value={email}
                        placeholder="you@example.com"
                    />
                    {#if emailError}<p class="text-red-500 text-sm mt-1">{emailError}</p>{/if}
                </div>
            </fieldset>

            <!-- Update Password Section -->
            <fieldset class="space-y-4 p-4 border rounded-md">
                <legend class="text-lg font-medium px-1">Update Password</legend>
                <div>
                    <Label for="password" class="mb-1 block">New Password</Label>
                    <Input
                        id="password"
                        type="password"
                        bind:value={password}
                        placeholder="••••••••"
                    />
                    {#if passwordError}<p class="text-red-500 text-sm mt-1">{passwordError}</p>{/if}
                </div>
                <div>
                    <Label for="repeatPassword" class="mb-1 block">Confirm New Password</Label>
                    <Input
                        id="repeatPassword"
                        type="password"
                        bind:value={repeatPassword}
                        placeholder="••••••••"
                    />
                    {#if repeatPasswordError}<p class="text-red-500 text-sm mt-1">
                            {repeatPasswordError}
                        </p>{/if}
                </div>
            </fieldset>

            <!-- Submission Area -->
            <div class="flex flex-col items-center pt-4">
                <Button type="submit" class="w-full">Update Account</Button>
                {#if generalError}<p class="text-red-500 text-sm mt-2">{generalError}</p>{/if}
                {#if successMessage}<p class="text-green-500 text-sm mt-2">{successMessage}</p>{/if}
            </div>
        </form>
    </Card.Content>
</Card.Root>
