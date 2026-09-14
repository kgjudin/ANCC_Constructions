import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { ScreenContainer } from '../components/ScreenContainer';
import { MobileButton } from '../components/Button';
import { mobileApi } from '../config/api';
import { useMobileAuthStore } from '../store/useAuthStore';

export const AttendanceScreen: React.FC = () => {
  const { employee } = useMobileAuthStore();
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);

  const today = new Date().toISOString().split('T')[0];

  const fetchAttendance = async () => {
    try {
      const res: any = await mobileApi.get(`/attendance?employee_id=${employee?.id}`);
      const items = res.data?.items || [];
      setLogs(items);

      const todayLog = items.find((l: any) => l.date === today);
      if (todayLog && todayLog.check_in && !todayLog.check_out) {
        setIsCheckedIn(true);
        setCheckInTime(todayLog.check_in);
      } else {
        setIsCheckedIn(false);
      }
    } catch (e) {
      console.warn(e);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, []);

  const handleToggleAttendance = async () => {
    setIsLoading(true);
    const nowTime = new Date().toTimeString().split(' ')[0].substring(0, 5);

    try {
      if (!isCheckedIn) {
        // Check in
        await mobileApi.post('/attendance', {
          date: today,
          check_in: nowTime,
          status: 'Present'
        });
        setIsCheckedIn(true);
        setCheckInTime(nowTime);
        Alert.alert('Checked In', `Successfully checked in at ${nowTime}`);
      } else {
        // Check out
        await mobileApi.post('/attendance', {
          date: today,
          check_in: checkInTime,
          check_out: nowTime,
          status: 'Present'
        });
        setIsCheckedIn(false);
        Alert.alert('Checked Out', `Successfully checked out at ${nowTime}`);
      }
      fetchAttendance();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to record attendance');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScreenContainer>
      <View style={styles.card}>
        <Text style={styles.title}>Daily Attendance Check-In</Text>
        <Text style={styles.dateText}>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</Text>

        <View style={styles.timerBox}>
          <Text style={styles.timerLabel}>{isCheckedIn ? 'Checked In Since:' : 'Current Status:'}</Text>
          <Text style={styles.timerValue}>{isCheckedIn ? checkInTime : 'Not Checked In'}</Text>
        </View>

        <MobileButton
          title={isCheckedIn ? 'Check Out Now' : 'Check In Now'}
          variant={isCheckedIn ? 'danger' : 'primary'}
          onPress={handleToggleAttendance}
          isLoading={isLoading}
        />
      </View>

      <Text style={styles.sectionHeader}>Recent Attendance Log</Text>
      {logs.map((item) => (
        <View key={item.id} style={styles.logCard}>
          <View style={styles.logHeader}>
            <Text style={styles.logDate}>{item.date}</Text>
            <Text style={[styles.logStatus, item.status === 'Present' ? styles.green : styles.amber]}>{item.status}</Text>
          </View>
          <Text style={styles.logTime}>In: {item.check_in || '—'}  |  Out: {item.check_out || '—'}</Text>
        </View>
      ))}
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a'
  },
  dateText: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
    marginBottom: 16
  },
  timerBox: {
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16
  },
  timerLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase'
  },
  timerValue: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0284c7',
    marginTop: 4
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 10,
    textTransform: 'uppercase'
  },
  logCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  logDate: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a'
  },
  logStatus: {
    fontSize: 12,
    fontWeight: '700'
  },
  green: { color: '#16a34a' },
  amber: { color: '#d97706' },
  logTime: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4
  }
});
