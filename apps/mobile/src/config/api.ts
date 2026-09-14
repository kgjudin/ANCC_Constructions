import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Dynamically extract the computer's LAN IP address from Expo hostUri
const getDynamicApiUrl = () => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // Extract IP address from Expo bundler host (e.g. 192.168.1.50:8081 -> 192.168.1.50)
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const lanIp = hostUri.split(':')[0];
    return `http://${lanIp}:5000/api/v1`;
  }

  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:5000/api/v1';
  }

  return 'http://localhost:5000/api/v1';
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
