import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const PRODUCTION_API_URL = 'https://ancc-constructions-1.onrender.com/api/v1';

// An Expo environment variable can still override this URL for local development.
const getDynamicApiUrl = () => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  return PRODUCTION_API_URL;
};

const BASE_URL = getDynamicApiUrl();
console.log('Mobile API Base URL:', BASE_URL);

export const mobileApi = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

mobileApi.interceptors.request.use(
  async (config) => {
    try {
      const token = await SecureStore.getItemAsync('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      console.warn('SecureStore error:', e);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

mobileApi.interceptors.response.use(
  (response) => response.data,
  (error) => Promise.reject(error.response?.data?.error || { message: error.message })
);
