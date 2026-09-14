import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView } from 'react-native';
import { ScreenContainer } from '../components/ScreenContainer';
import { MobileInput } from '../components/Input';
import { MobileButton } from '../components/Button';
import { mobileApi } from '../config/api';

export const LeaveRequestScreen: React.FC = () => {
  const [leaveTypes, setLeaveTypes] = useState<any[]>([]);
  const [selectedLeaveTypeId, setSelectedLeaveTypeId] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);

  const fetchLeaveData = async () => {
    try {
      const [ltRes, reqRes]: any[] = await Promise.all([
        mobileApi.get('/leave-types'),
        mobileApi.get('/leave/requests')
      ]);
      const types = ltRes.data || [];
      setLeaveTypes(types);
      if (types.length > 0) setSelectedLeaveTypeId(types[0].id);
      setLeaveRequests(reqRes.data?.items || []);
    } catch (e) {
      console.warn(e);
    }
  };

  useEffect(() => {
    fetchLeaveData();
  }, []);

  const handleSubmitRequest = async () => {
    if (!reason) {
      Alert.alert('Validation Error', 'Please enter a reason for your leave request');
      return;
    }

    setIsLoading(true);
    try {
      await mobileApi.post('/leave/requests', {
        leave_type_id: selectedLeaveTypeId,
        start_date: startDate,
        end_date: endDate,
        reason
      });
      Alert.alert('Success', 'Leave request submitted for management review');
      setReason('');
      fetchLeaveData();
    } catch (err: any) {
      Alert.alert('Submission Error', err.message || 'Failed to submit leave application');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScreenContainer>
      <View style={styles.card}>
        <Text style={styles.title}>Apply for Leave</Text>

        <MobileInput
          label="Start Date (YYYY-MM-DD)"
          value={startDate}
          onChangeText={setStartDate}
        />

        <MobileInput
          label="End Date (YYYY-MM-DD)"
          value={endDate}
          onChangeText={setEndDate}
        />

        <MobileInput
          label="Reason for Leave"
          placeholder="e.g. Family medical emergency"
          value={reason}
          onChangeText={setReason}
          multiline
          numberOfLines={3}
        />

        <MobileButton title="Submit Leave Request" onPress={handleSubmitRequest} isLoading={isLoading} />
      </View>

      <Text style={styles.sectionHeader}>Your Submitted Leave Applications</Text>
      {leaveRequests.map((req) => (
        <View key={req.id} style={styles.reqCard}>
          <View style={styles.reqHeader}>
            <Text style={styles.reqType}>{req.leave_type_name}</Text>
            <Text style={[styles.reqStatus, req.status === 'Approved' ? styles.green : req.status === 'Pending' ? styles.amber : styles.red]}>
              {req.status}
            </Text>
          </View>
          <Text style={styles.reqDates}>{req.start_date} to {req.end_date} ({req.total_days} days)</Text>
          <Text style={styles.reqReason}>"{req.reason}"</Text>
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
    color: '#0f172a',
    marginBottom: 12
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 10,
    textTransform: 'uppercase'
  },
  reqCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  reqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  reqType: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a'
  },
  reqStatus: {
    fontSize: 12,
    fontWeight: '700'
  },
  green: { color: '#16a34a' },
  amber: { color: '#d97706' },
  red: { color: '#dc2626' },
  reqDates: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0284c7',
    marginTop: 4
  },
  reqReason: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
    fontStyle: 'italic'
  }
});
