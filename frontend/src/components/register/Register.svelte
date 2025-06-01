<script>
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

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
    <label for="first-name-input">First Name</label>
    <input
        type="text"
        id="first-name-input"
        placeholder="Enter first name"
        bind:value={firstName}
    />
    {#if firstNameError}
        <p style="color: red;">{firstNameError}</p>
    {/if}

    <label for="last-name-input">Last Name</label>
    <input type="text" id="last-name-input" placeholder="Enter last name" bind:value={lastName} />
    {#if lastNameError}
        <p style="color: red;">{lastNameError}</p>
    {/if}

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

    <label for="repeat-password-input">Repeat Password</label>
    <input
        type="password"
        id="repeat-password-input"
        placeholder="Repeat password"
        bind:value={repeatPassword}
    />
    {#if repeatPasswordError}
        <p style="color: red;">{repeatPasswordError}</p>
    {/if}

    <button type="submit">Submit</button>
</form>
