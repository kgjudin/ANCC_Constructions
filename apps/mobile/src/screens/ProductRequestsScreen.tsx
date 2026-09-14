import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView, TouchableOpacity } from 'react-native';
import { ScreenContainer } from '../components/ScreenContainer';
import { MobileInput } from '../components/Input';
import { MobileButton } from '../components/Button';
import { mobileApi } from '../config/api';

export const ProductRequestsScreen: React.FC = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  const [selectedSiteId, setSelectedSiteId] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [productName, setProductName] = useState('');
  const [category, setCategory] = useState('Cement & Concrete');
  const [quantity, setQuantity] = useState('10');
  const [unit, setUnit] = useState('Bags');
  const [priority, setPriority] = useState('Medium');
  const [reason, setReason] = useState('');

  const [activeTab, setActiveTab] = useState<'create' | 'list'>('list');
  const [isLoading, setIsLoading] = useState(false);

  const fetchData = async () => {
    try {
      const [reqRes, sRes, pRes]: any[] = await Promise.all([
        mobileApi.get('/product-requests'),
        mobileApi.get('/sites'),
        mobileApi.get('/products')
      ]);

      const reqItems = reqRes.data?.items || [];
      const sItems = sRes.data?.items || [];
      const pItems = pRes.data?.items || [];

      setRequests(reqItems);
      setSites(sItems);
      setProducts(pItems);

      if (sItems.length > 0 && !selectedSiteId) setSelectedSiteId(sItems[0].id);
      if (pItems.length > 0 && !selectedProductId) {
        setSelectedProductId(pItems[0].id);
        setProductName(pItems[0].name);
        setUnit(pItems[0].unit);
      }
    } catch (e) {
      console.warn(e);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateRequest = async () => {
    if (!selectedSiteId || !productName) {
      Alert.alert('Validation Error', 'Please select a site and enter a product name');
      return;
    }

    setIsLoading(true);

    try {
      await mobileApi.post('/product-requests', {
        site_id: selectedSiteId,
        product_id: selectedProductId || null,
        product_name: productName,
        category,
        quantity: Number(quantity) || 1,
        unit,
        required_date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
        priority,
        reason
      });

      Alert.alert('Success', 'Product request submitted successfully');
      setReason('');
      setActiveTab('list');
      fetchData();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to submit product request');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await mobileApi.patch(`/product-requests/${id}/status`, { status });
      Alert.alert('Updated', `Request status changed to ${status}`);
      fetchData();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update status');
    }
  };

  const selectedSite = sites.find((s) => s.id === selectedSiteId);
  const selectedProd = products.find((p) => p.id === selectedProductId);

  return (
    <ScreenContainer>
      {/* Tab Switcher */}
      <View style={styles.tabHeader}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'list' && styles.tabBtnActive]}
          onPress={() => setActiveTab('list')}
        >
          <Text style={[styles.tabText, activeTab === 'list' && styles.tabTextActive]}>Requests ({requests.length})</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'create' && styles.tabBtnActive]}
          onPress={() => setActiveTab('create')}
        >
          <Text style={[styles.tabText, activeTab === 'create' && styles.tabTextActive]}>+ New Request</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'create' ? (
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            <Text style={styles.title}>Submit Material Request</Text>

            {/* Site Picker */}
            <TouchableOpacity
              style={styles.fieldGroup}
              onPress={() => {
                const nextIdx = (sites.findIndex((s) => s.id === selectedSiteId) + 1) % (sites.length || 1);
                if (sites[nextIdx]) setSelectedSiteId(sites[nextIdx].id);
              }}
            >
              <Text style={styles.fieldLabel}>Construction Site (Tap to Switch):</Text>
              <Text style={styles.fieldValue}>{selectedSite?.name || 'Select Site'}</Text>
            </TouchableOpacity>

            {/* Product Picker */}
            <TouchableOpacity
              style={styles.fieldGroup}
              onPress={() => {
                const nextIdx = (products.findIndex((p) => p.id === selectedProductId) + 1) % (products.length || 1);
                if (products[nextIdx]) {
                  setSelectedProductId(products[nextIdx].id);
                  setProductName(products[nextIdx].name);
                  setUnit(products[nextIdx].unit);
                }
              }}
            >
              <Text style={styles.fieldLabel}>Select Existing Product (Tap to Switch):</Text>
              <Text style={styles.fieldValue}>{selectedProd?.name || 'Custom Product'}</Text>
            </TouchableOpacity>

            <MobileInput label="Product Name" value={productName} onChangeText={setProductName} placeholder="e.g. Cement / Steel Bars" />

            <View style={styles.row}>
              <View style={styles.col}>
                <MobileInput label="Quantity" keyboardType="numeric" value={quantity} onChangeText={setQuantity} />
              </View>
              <View style={styles.col}>
                <MobileInput label="Unit" value={unit} onChangeText={setUnit} />
              </View>
            </View>

            {/* Priority Picker */}
            <TouchableOpacity
              style={styles.fieldGroup}
              onPress={() => {
                const pList = ['Low', 'Medium', 'High', 'Urgent'];
                const nextIdx = (pList.indexOf(priority) + 1) % pList.length;
                setPriority(pList[nextIdx]);
              }}
            >
              <Text style={styles.fieldLabel}>Priority Level (Tap to Switch):</Text>
              <Text style={styles.fieldValue}>{priority}</Text>
            </TouchableOpacity>

            <MobileInput label="Reason / Usage Notes" value={reason} onChangeText={setReason} placeholder="Why is this material required?" />

            <MobileButton title="Submit Material Request" onPress={handleCreateRequest} isLoading={isLoading} />
          </View>
        </ScrollView>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {requests.map((req) => (
            <View key={req.id} style={styles.reqCard}>
              <View style={styles.reqHeader}>
                <Text style={styles.reqCode}>{req.request_code}</Text>
                <Text style={[styles.priorityBadge, req.priority === 'Urgent' ? styles.pUrgent : styles.pMedium]}>
                  {req.priority}
                </Text>
              </View>
              <Text style={styles.reqProduct}>{req.product_name}</Text>
              <Text style={styles.reqQty}>{req.quantity} {req.unit} • {req.site_name}</Text>

              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Status:</Text>
                <Text style={styles.statusText}>{req.status}</Text>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionRow}>
                {req.status === 'Pending' && (
                  <TouchableOpacity style={styles.btnApprove} onPress={() => handleUpdateStatus(req.id, 'Approved')}>
                    <Text style={styles.btnText}>Approve</Text>
                  </TouchableOpacity>
                )}
                {req.status === 'Approved' && (
                  <TouchableOpacity style={styles.btnOrder} onPress={() => handleUpdateStatus(req.id, 'Ordered')}>
                    <Text style={styles.btnText}>Mark Ordered</Text>
                  </TouchableOpacity>
                )}
                {req.status === 'Ordered' && (
                  <TouchableOpacity style={styles.btnReceive} onPress={() => handleUpdateStatus(req.id, 'Received')}>
                    <Text style={styles.btnText}>Confirm Received</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  tabHeader: {
    flexDirection: 'row',
    marginBottom: 16,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 4
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8
  },
  tabBtnActive: {
    backgroundColor: '#0284c7'
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94a3b8'
  },
  tabTextActive: {
    color: '#ffffff'
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 12
  },
  fieldGroup: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 12,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase'
  },
  fieldValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0284c7',
    marginTop: 2
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  col: {
    width: '48%'
  },
  reqCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  reqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  reqCode: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0284c7'
  },
  priorityBadge: {
    fontSize: 10,
    fontWeight: '800',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: 'hidden'
  },
  pUrgent: {
    backgroundColor: '#fee2e2',
    color: '#b91c1c'
  },
  pMedium: {
    backgroundColor: '#f1f5f9',
    color: '#334155'
  },
  reqProduct: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 4
  },
  reqQty: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8
  },
  statusLabel: {
    fontSize: 11,
    color: '#64748b'
  },
  statusText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0369a1',
    marginLeft: 6
  },
  actionRow: {
    flexDirection: 'row',
    marginTop: 10
  },
  btnApprove: {
    backgroundColor: '#16a34a',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginRight: 6
  },
  btnOrder: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginRight: 6
  },
  btnReceive: {
    backgroundColor: '#059669',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6
  },
  btnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ffffff'
  }
});
