<script>
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
    import { onMount } from 'svelte';
    let cryptocurrenciesArray = '';

    async function getCryptocurrencies() {
        try {
            const response = await fetch(`${apiBaseUrl}/cryptocurrencies`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
            });

            const responseData = await response.json();

            if (response.ok) {
                cryptocurrenciesArray = responseData.data;
                console.log(cryptocurrenciesArray);
            } else console.log(responseData.error);
        } catch (error) {
            console.log('Error fetching data', error);
        }
    }

    onMount(() => {
        getCryptocurrencies();
        console.log(cryptocurrenciesArray);
    });
</script>
