import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView, TouchableOpacity } from 'react-native';
import { ScreenContainer } from '../components/ScreenContainer';
import { MobileInput } from '../components/Input';
import { MobileButton } from '../components/Button';
import { mobileApi } from '../config/api';

export const InventoryScreen: React.FC = () => {
  const [inventory, setInventory] = useState<any[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  const [activeTab, setActiveTab] = useState<'stock' | 'usage' | 'transfer'>('stock');

  // Form states
  const [selectedSiteId, setSelectedSiteId] = useState('');
  const [toSiteId, setToSiteId] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState('10');
  const [unit, setUnit] = useState('Bags');
  const [activity, setActivity] = useState('Slab Concrete Work');
  const [reason, setReason] = useState('Site re-allocation');

  const [isLoading, setIsLoading] = useState(false);

  const fetchData = async () => {
    try {
      const [invRes, sRes, pRes]: any[] = await Promise.all([
        mobileApi.get('/inventory'),
        mobileApi.get('/sites'),
        mobileApi.get('/products')
      ]);

      const invItems = invRes.data?.items || [];
      const sItems = sRes.data?.items || [];
      const pItems = pRes.data?.items || [];

      setInventory(invItems);
      setSites(sItems);
      setProducts(pItems);

      if (sItems.length > 0 && !selectedSiteId) {
        setSelectedSiteId(sItems[0].id);
        if (sItems.length > 1) setToSiteId(sItems[1].id);
      }
      if (pItems.length > 0 && !selectedProductId) {
        setSelectedProductId(pItems[0].id);
        setUnit(pItems[0].unit);
      }
    } catch (e) {
      console.warn(e);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRecordUsage = async () => {
    if (!selectedSiteId || !selectedProductId) {
      Alert.alert('Validation Error', 'Please select a site and material');
      return;
    }

    const qty = Number(quantity);
    if (qty <= 0) {
      Alert.alert('Validation Error', 'Quantity must be greater than 0');
      return;
    }

    setIsLoading(true);

    try {
      await mobileApi.post('/inventory/usage', {
        site_id: selectedSiteId,
        product_id: selectedProductId,
        quantity_used: qty,
        unit,
        activity,
        usage_date: new Date().toISOString().split('T')[0]
      });

      Alert.alert('Success', 'Material usage recorded and stock balance deducted');
      setQuantity('10');
      setActiveTab('stock');
      fetchData();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to record usage');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTransfer = async () => {
    if (selectedSiteId === toSiteId) {
      Alert.alert('Validation Error', 'Destination site must be different from source site');
      return;
    }

    setIsLoading(true);

    try {
      await mobileApi.post('/inventory/transfers', {
        from_site_id: selectedSiteId,
        to_site_id: toSiteId,
        product_id: selectedProductId,
        quantity: Number(quantity) || 1,
        unit,
        reason,
        transfer_date: new Date().toISOString().split('T')[0]
      });

      Alert.alert('Success', 'Material transfer request created');
      setActiveTab('stock');
      fetchData();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to create transfer');
    } finally {
      setIsLoading(false);
    }
  };

  const selectedSite = sites.find((s) => s.id === selectedSiteId);
  const destSite = sites.find((s) => s.id === toSiteId);
  const selectedProd = products.find((p) => p.id === selectedProductId);

  return (
    <ScreenContainer>
      {/* Mobile Tab Header */}
      <View style={styles.tabHeader}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'stock' && styles.tabBtnActive]}
          onPress={() => setActiveTab('stock')}
        >
          <Text style={[styles.tabText, activeTab === 'stock' && styles.tabTextActive]}>Stock Balances</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'usage' && styles.tabBtnActive]}
          onPress={() => setActiveTab('usage')}
        >
          <Text style={[styles.tabText, activeTab === 'usage' && styles.tabTextActive]}>- Record Usage</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'transfer' && styles.tabBtnActive]}
          onPress={() => setActiveTab('transfer')}
        >
          <Text style={[styles.tabText, activeTab === 'transfer' && styles.tabTextActive]}>⇄ Transfer</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'stock' && (
        <ScrollView showsVerticalScrollIndicator={false}>
          {inventory.map((item) => {
            const isLow = Number(item.current_balance || 0) <= Number(item.min_stock_level || 10);
            return (
              <View key={item.id} style={styles.stockCard}>
                <View style={styles.stockHeader}>
                  <Text style={styles.siteTitle}>{item.site_name}</Text>
                  {isLow && <Text style={styles.lowStockBadge}>LOW STOCK</Text>}
                </View>
                <Text style={styles.productTitle}>{item.product_name}</Text>
                <View style={styles.balanceBox}>
                  <Text style={styles.balanceLabel}>Current Balance:</Text>
                  <Text style={[styles.balanceValue, isLow ? styles.textRed : styles.textGreen]}>
                    {item.current_balance} {item.unit}
                  </Text>
                </View>
                <Text style={styles.metaText}>
                  Recv: {Number(item.opening_stock || 0) + Number(item.received_qty || 0)} | Used: {item.used_qty} | Damaged: {item.damaged_qty}
                </Text>
              </View>
            );
          })}
        </ScrollView>
      )}

      {activeTab === 'usage' && (
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            <Text style={styles.title}>Record Material Usage</Text>

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
                  setUnit(products[nextIdx].unit);
                }
              }}
            >
              <Text style={styles.fieldLabel}>Material / Product (Tap to Switch):</Text>
              <Text style={styles.fieldValue}>{selectedProd?.name || 'Select Material'}</Text>
            </TouchableOpacity>

            <View style={styles.row}>
              <View style={styles.col}>
                <MobileInput label="Quantity Used" keyboardType="numeric" value={quantity} onChangeText={setQuantity} />
              </View>
              <View style={styles.col}>
                <MobileInput label="Unit" value={unit} onChangeText={setUnit} />
              </View>
            </View>

            <MobileInput label="Activity / Work Description" value={activity} onChangeText={setActivity} placeholder="e.g. Column casting" />

            <MobileButton title="Deduct & Record Usage" onPress={handleRecordUsage} isLoading={isLoading} />
          </View>
        </ScrollView>
      )}

      {activeTab === 'transfer' && (
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            <Text style={styles.title}>Inter-Site Material Transfer</Text>

            {/* From Site */}
            <TouchableOpacity
              style={styles.fieldGroup}
              onPress={() => {
                const nextIdx = (sites.findIndex((s) => s.id === selectedSiteId) + 1) % (sites.length || 1);
                if (sites[nextIdx]) setSelectedSiteId(sites[nextIdx].id);
              }}
            >
              <Text style={styles.fieldLabel}>From Site (Source):</Text>
              <Text style={styles.fieldValue}>{selectedSite?.name || 'Select Source Site'}</Text>
            </TouchableOpacity>

            {/* To Site */}
            <TouchableOpacity
              style={styles.fieldGroup}
              onPress={() => {
                const nextIdx = (sites.findIndex((s) => s.id === toSiteId) + 1) % (sites.length || 1);
                if (sites[nextIdx]) setToSiteId(sites[nextIdx].id);
              }}
            >
              <Text style={styles.fieldLabel}>To Site (Destination):</Text>
              <Text style={styles.fieldValue}>{destSite?.name || 'Select Destination Site'}</Text>
            </TouchableOpacity>

            {/* Material Picker */}
            <TouchableOpacity
              style={styles.fieldGroup}
              onPress={() => {
                const nextIdx = (products.findIndex((p) => p.id === selectedProductId) + 1) % (products.length || 1);
                if (products[nextIdx]) {
                  setSelectedProductId(products[nextIdx].id);
                  setUnit(products[nextIdx].unit);
                }
              }}
            >
              <Text style={styles.fieldLabel}>Material to Transfer:</Text>
              <Text style={styles.fieldValue}>{selectedProd?.name || 'Select Material'}</Text>
            </TouchableOpacity>

            <View style={styles.row}>
              <View style={styles.col}>
                <MobileInput label="Quantity" keyboardType="numeric" value={quantity} onChangeText={setQuantity} />
              </View>
              <View style={styles.col}>
                <MobileInput label="Unit" value={unit} onChangeText={setUnit} />
              </View>
            </View>

            <MobileInput label="Transfer Reason" value={reason} onChangeText={setReason} placeholder="Reason for transfer..." />

            <MobileButton title="Request Material Transfer" onPress={handleCreateTransfer} isLoading={isLoading} />
          </View>
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
    fontSize: 11,
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
  stockCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  stockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  siteTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0f172a'
  },
  lowStockBadge: {
    fontSize: 10,
    fontWeight: '900',
    backgroundColor: '#fee2e2',
    color: '#dc2626',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  productTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0284c7',
    marginTop: 4
  },
  balanceBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 8
  },
  balanceLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569'
  },
  balanceValue: {
    fontSize: 16,
    fontWeight: '900'
  },
  textGreen: {
    color: '#16a34a'
  },
  textRed: {
    color: '#dc2626'
  },
  metaText: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 6
  }
});
