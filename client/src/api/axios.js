// src/api/axios.js
import axios from 'axios';

// Create a new axios instance
const API = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api', // Make sure this is your backend's base URL
});

// Use a request interceptor to add the auth token to every request
API.interceptors.request.use((config) => {
    const userInfo = localStorage.getItem('userInfo');

    if (userInfo) {
        const token = JSON.parse(userInfo).token;
        
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    
    return config;
}, (error) => {
    return Promise.reject(error);
});

// Add a response interceptor to handle errors, especially 401 Unauthorized
API.interceptors.response.use(
    (response) => response, // Just return the response if it's successful
    (error) => {
        // Check if the response status is 401
        if (error.response && error.response.status === 401) {
            console.error('401 Unauthorized: Session expired or invalid token.');

            // Clear the invalid user info from local storage
            localStorage.removeItem('userInfo');
            
            // Redirect to the login page
            window.location.href = '/login'; 
            // In a React Router app, you might use: navigate('/login', { replace: true });
        }

        return Promise.reject(error);
    }
);

export default API;