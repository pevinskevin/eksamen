<script>
    let email = '';
    let password = '';
    let confirm_password = '';

    function handleSubmit(){
        console.log('Form submitted!');
        console.log('Email:', email);
        console.log('Password:', password);
        console.log('Confirm Password:', confirm_password);
    }
</script>

<form on:submit={handleSubmit}>
    <label for="email-input">Email</label>
    <input type="text" id="email-input" placeholder="Enter email" bind:value={email}>

    <label for="password-input">Password</label>
    <input type="password" id="password-input" placeholder="Enter password" bind:value={password}>

    <label for="confirm-password-input">Confirm Password</label>
    <input type="password" id="confirm-password-input" placeholder="Repeat password" bind:value={confirm_password}>
    <button type="submit">Submit</button>
</form>

