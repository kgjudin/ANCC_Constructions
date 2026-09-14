import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { mobileApi } from '../config/api';
import { useMobileAuthStore } from '../store/useAuthStore';
import { MobileInput } from '../components/Input';
import { MobileButton } from '../components/Button';

export const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const login = useMobileAuthStore((state) => state.login);

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please fill in both email and password');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const res: any = await mobileApi.post('/auth/login', { email, password });
      if (res.success && res.data?.token) {
        await login(res.data.token, res.data.user);
      } else {
        setError(res.message || 'Login failed');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.brandTitle}>ANCC</Text>
          <Text style={styles.brandSubtitle}>CONSTRUCTION MANAGEMENT</Text>
          <Text style={styles.loginTitle}>Employee Portal</Text>
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <MobileInput
          label="Email Address"
          placeholder="employee@construction.com"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />

        <MobileInput
          label="Password"
          placeholder="••••••••"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <MobileButton title="Sign In" onPress={handleLogin} isLoading={isLoading} />

        <Text style={styles.footerNote}>
          Traceable Employee Attribution & RBAC Active
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    padding: 20
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5
  },
  header: {
    alignItems: 'center',
    marginBottom: 20
  },
  brandTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#0284c7'
  },
  brandSubtitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 1.5,
    marginTop: 2
  },
  loginTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 12
  },
  errorText: {
    color: '#ef4444',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 10
  },
  footerNote: {
    textAlign: 'center',
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 16
  }
});
