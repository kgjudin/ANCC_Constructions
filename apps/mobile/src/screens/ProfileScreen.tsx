import React from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { ScreenContainer } from '../components/ScreenContainer';
import { MobileButton } from '../components/Button';
import { useMobileAuthStore } from '../store/useAuthStore';

export const ProfileScreen: React.FC = () => {
  const { employee, user, role, logout } = useMobileAuthStore();

  const handleLogout = async () => {
    Alert.alert('Confirm Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => logout() }
    ]);
  };

  return (
    <ScreenContainer>
      <View style={styles.card}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>
            {employee?.full_name ? employee.full_name.charAt(0) : 'E'}
          </Text>
        </View>

        <Text style={styles.name}>{employee?.full_name || 'Employee'}</Text>
        <Text style={styles.roleText}>{role?.name || 'Staff'}</Text>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Employee Code:</Text>
          <Text style={styles.infoValue}>{employee?.employee_code || 'EMP-0000'}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Email Address:</Text>
          <Text style={styles.infoValue}>{employee?.email || user?.email}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Phone Number:</Text>
          <Text style={styles.infoValue}>{employee?.phone || 'N/A'}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Joining Date:</Text>
          <Text style={styles.infoValue}>{employee?.joining_date || 'N/A'}</Text>
        </View>

        <View style={styles.divider} />

        <MobileButton title="Sign Out" variant="danger" onPress={handleLogout} />
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2
  },
  avatarCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#0284c7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '800'
  },
  name: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a'
  },
  roleText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0284c7',
    marginTop: 2
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    width: '100%',
    marginVertical: 16
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginVertical: 6
  },
  infoLabel: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600'
  },
  infoValue: {
    fontSize: 13,
    color: '#0f172a',
    fontWeight: '700'
  }
});
