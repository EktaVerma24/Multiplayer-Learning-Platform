// src/api/axios.js
import axios from 'axios';

// Create a new axios instance
const API = axios.create({
    baseURL: 'http://localhost:5000/api', // Make sure this is your backend's base URL
});

// Use an interceptor to add the auth token to every request
API.interceptors.request.use((config) => {
    // 1. Get the user info from localStorage
    const userInfo = localStorage.getItem('userInfo');

    if (userInfo) {
        // 2. Parse it and get the token
        const token = JSON.parse(userInfo).token;
        
        // 3. If the token exists, add it to the headers
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    
    // 4. Return the modified config
    return config;
}, (error) => {
    return Promise.reject(error);
});

export default API;