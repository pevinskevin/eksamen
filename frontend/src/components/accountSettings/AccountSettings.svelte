<script>
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

    import Input from '$lib/components/ui/input/input.svelte';
    import Label from '$lib/components/ui/label/label.svelte';
    import { Button } from '$lib/components/ui/button';
    import * as Card from '$lib/components/ui/card';
    import { navigate } from 'svelte-routing';

    let firstName = '';
    let firstNameError = '';

    let lastName = '';
    let lastNameError = '';

    let email = '';
    let emailError = '';

    let password = '';
    let passwordError = '';

    let repeatPassword = '';
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

    async function handleUpdate(updatedUserObject) {
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
        )
        try {
            const response = await fetch(`${apiBaseUrl}/account`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(updatedUserObject)
            });

            const responseData = await response.json();
            
            if (response.ok) console.log(responseData);

        } catch (error) {
            console.log(error);
        }
    }
</script>

<form on:submit={handleUpdate}>

</form>
