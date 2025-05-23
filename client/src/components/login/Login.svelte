<script>
    const baseUrl = import.meta.env.VITE_API_BASE_URL

    let email = 'admin@test.com';
    let emailError = '';

    let password = 'test';
    let passwordError = '';

    function validateEmail(){
        if (!email){
            emailError = 'Email is required';
        } else if (!email.includes('@') || !email.includes('.')){
            emailError = 'Please enter a valid email address.';
        } else {
            emailError = '';
        }
    }

    function validatePassword(){
        if (!password){
            passwordError = 'Password is required.'
        } else {
            passwordError = '';
        }
    }

    async function handleSubmit(){
        emailError = '';
        passwordError = '';

        validateEmail();
        validatePassword();

        if (!emailError && !passwordError){
            console.log('Form is valid', email, password, );
            console.log('Form submitted!');

            try {
                const response = await fetch(`${baseUrl}/api/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email: email, password: password})
                });

                const responseData = await response.json();

                if (response.ok){
                    console.log(responseData.message, '- Login successful.');
                } else console.log(responseData.errorMessage);

            } catch (error) {
                console.log(error);
            }

        } else {
            console.log("Form has errors.");
        }
    }

</script>

<form on:submit|preventDefault={handleSubmit}>
    <label for="email-input">Email</label>
    <input type="text" id="email-input" placeholder="Enter email" bind:value={email}>
    {#if emailError}
        <p style="color: red;">{emailError}</p>
    {/if}

    <label for="password-input">Password</label>
    <input type="password" id="password-input" placeholder="Enter password" bind:value={password}>
    {#if passwordError}
        <p style="color: red;">{passwordError}</p>
    {/if}

    <button type="submit">Submit</button>
</form>