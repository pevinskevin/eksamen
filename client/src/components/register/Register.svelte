<script>
    let email = '';
    let emailError = '';

    let password = '';
    let confirmPassword = '';

    let passwordError = '';
    let confirmPasswordError = '';

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

    function validateConfirmPassword(){
        if (!confirmPassword){
            confirmPasswordError = 'Confirming your password is required.';
        } else if (password && password !== confirmPassword){
            confirmPasswordError = 'Passwords do not match.';
        } else {
            confirmPasswordError = '';
        }
    }

    function handleSubmit(){
        emailError = '';
        passwordError = '';
        confirmPasswordError = '';

        validateEmail();
        validatePassword();
        validateConfirmPassword();

        if (!emailError && !passwordError && !confirmPasswordError){
            console.log('Form is valid', email, password, confirmPassword);
            console.log('Form submitted!');
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

    <label for="confirm-password-input">Confirm Password</label>
    <input type="password" id="confirm-password-input" placeholder="Repeat password" bind:value={confirmPassword}>
    {#if confirmPasswordError}
        <p style="color: red;">{confirmPasswordError}</p>
    {/if}
    
    <button type="submit">Submit</button>
</form>

