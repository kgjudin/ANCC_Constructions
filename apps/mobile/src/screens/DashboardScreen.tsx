import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { ScreenContainer } from '../components/ScreenContainer';
import { useMobileAuthStore } from '../store/useAuthStore';
import { mobileApi } from '../config/api';

export const DashboardScreen: React.FC = () => {
  const { employee, role } = useMobileAuthStore();
  const [attendanceToday, setAttendanceToday] = useState<any>(null);
  const [leaveBalances, setLeaveBalances] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const today = new Date().toISOString().split('T')[0];
      const [attRes, balRes]: any[] = await Promise.all([
        mobileApi.get(`/attendance?employee_id=${employee?.id}&date=${today}`),
        mobileApi.get(`/leave/balances?employee_id=${employee?.id}`)
      ]);

      const attLogs = attRes.data?.items || [];
      setAttendanceToday(attLogs.length > 0 ? attLogs[0] : null);
      setLeaveBalances(balRes.data || []);
    } catch (e) {
      console.warn(e);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <ScreenContainer>
      {/* Employee Greeting Header */}
      <View style={styles.profileHeader}>
        <View>
          <Text style={styles.welcomeLabel}>Welcome Back,</Text>
          <Text style={styles.employeeName}>{employee?.full_name || 'Employee'}</Text>
          <Text style={styles.employeeRole}>{role?.name || 'Staff'}</Text>
        </View>
        <View style={styles.codeBadge}>
          <Text style={styles.codeText}>{employee?.employee_code || 'EMP-0000'}</Text>
        </View>
      </View>

      {/* Attendance Status Today Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Today's Attendance Status</Text>
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Status:</Text>
          <Text style={[styles.statusValue, attendanceToday?.status === 'Present' ? styles.textGreen : styles.textAmber]}>
            {attendanceToday?.status || 'Not Checked In'}
          </Text>
        </View>
        {attendanceToday?.check_in ? (
          <Text style={styles.timeDetail}>Check In: {attendanceToday.check_in}</Text>
        ) : null}
      </View>

      {/* Leave Balances Summary */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Your Leave Balances</Text>
        {leaveBalances.map((b) => (
          <View key={b.id} style={styles.balanceRow}>
            <Text style={styles.leaveType}>{b.leave_type_name}</Text>
            <Text style={styles.balanceValue}>
              <Text style={styles.remainingText}>{b.remaining_days}</Text> / {b.allocated_days} days
            </Text>
          </View>
        ))}
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  profileHeader: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  welcomeLabel: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase'
  },
  employeeName: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '800',
    marginTop: 2
  },
  employeeRole: {
    color: '#38bdf8',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2
  },
  codeBadge: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155'
  },
  codeText: {
    color: '#38bdf8',
    fontSize: 13,
    fontWeight: '700'
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 12,
    textTransform: 'uppercase'
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  statusLabel: {
    fontSize: 15,
    color: '#64748b'
  },
  statusValue: {
    fontSize: 18,
    fontWeight: '800'
  },
  textGreen: {
    color: '#16a34a'
  },
  textAmber: {
    color: '#d97706'
  },
  timeDetail: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 8
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9'
  },
  leaveType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a'
  },
  balanceValue: {
    fontSize: 14,
    color: '#64748b'
  },
  remainingText: {
    fontWeight: '800',
    color: '#0284c7'
  }
});
