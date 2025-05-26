<script>
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

    let email = 'example@test.com';
    let emailError = '';

    let password = '1234';
    let passwordError = '';

    let confirmPassword = '1234';
    let confirmPasswordError = '';

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

    function validateConfirmPassword() {
        if (!confirmPassword) {
            confirmPasswordError = 'Confirming your password is required.';
        } else if (password && password !== confirmPassword) {
            confirmPasswordError = 'Passwords do not match.';
        } else {
            confirmPasswordError = '';
        }
    }

    async function handleSubmit() {
        emailError = '';
        passwordError = '';
        confirmPasswordError = '';

        validateEmail();
        validatePassword();
        validateConfirmPassword();

        if (!emailError && !passwordError && !confirmPasswordError) {
            console.log('Regiter form is valid', email, password, confirmPassword);
            console.log('Register form submitted!');

            try {
                const response = await fetch(`${apiBaseUrl}/register`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email, password }),
                    credentials: 'include'
                });

                const responseData = await response.json();

                if (response.ok) {
                    console.log(responseData.message);
                    // Redirect to login page or show success message
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

<form on:submit|preventDefault={handleSubmit}>
    <label for="email-input">Email</label>
    <input type="text" id="email-input" placeholder="Enter email" bind:value={email} />
    {#if emailError}
        <p style="color: red;">{emailError}</p>
    {/if}

    <label for="password-input">Password</label>
    <input type="password" id="password-input" placeholder="Enter password" bind:value={password} />
    {#if passwordError}
        <p style="color: red;">{passwordError}</p>
    {/if}

    <label for="confirm-password-input">Confirm Password</label>
    <input
        type="password"
        id="confirm-password-input"
        placeholder="Repeat password"
        bind:value={confirmPassword}
    />
    {#if confirmPasswordError}
        <p style="color: red;">{confirmPasswordError}</p>
    {/if}

    <button type="submit">Submit</button>
</form>
