import authStore from '../store/authStore';

async function centralAPIHandler(url, options) {
    try {
        const response = await fetch(url, options);
        const responseData = await response.json();

        
    } catch (error) {}
}
