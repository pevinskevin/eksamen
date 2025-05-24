import axios from 'axios';
import { CookieJar } from 'tough-cookie';
import { wrapper } from 'axios-cookiejar-support';

// Create an in-memory cookie jar
const jar = new CookieJar();

// Create an Axios instance, and pass the jar to it.
// The wrapper will then ensure cookies from the jar are sent.
const instance = axios.create({ jar });

// Wrap the instance with axios-cookiejar-support
const sharedAxiosInstance = wrapper(instance);

export default sharedAxiosInstance;
