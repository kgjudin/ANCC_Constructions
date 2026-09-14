import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { ScreenContainer } from '../components/ScreenContainer';
import { MobileInput } from '../components/Input';
import { MobileButton } from '../components/Button';
import { mobileApi } from '../config/api';

interface LineItem {
  description: string;
  quantity: string;
  unit_price: string;
}

export const AccountantScreen: React.FC = () => {
  const [sites, setSites] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState('');

  // Bill Header Metadata
  const [billNumber, setBillNumber] = useState('');
  const [billDate, setBillDate] = useState(new Date().toISOString().split('T')[0]);
  const [vendorName, setVendorName] = useState('');

  // Dynamic Line Items
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { description: 'Item Description', quantity: '1', unit_price: '100' }
  ]);

  // Tax & Discount
  const [tax, setTax] = useState('0');
  const [discount, setDiscount] = useState('0');

  const [activeTab, setActiveTab] = useState<'create' | 'list'>('create');
  const [isLoading, setIsLoading] = useState(false);

  const fetchData = async () => {
    try {
      const [sRes, dRes]: any[] = await Promise.all([
        mobileApi.get('/sites'),
        mobileApi.get('/finance/documents')
      ]);

      const sItems = sRes.data?.items || [];
      const dItems = dRes.data?.items || [];

      setSites(sItems);
      setDocuments(dItems);

      if (sItems.length > 0 && !selectedSiteId) {
        setSelectedSiteId(sItems[0].id);
      }

      const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
      const seq = String((dItems.length || 0) + 1).padStart(3, '0');
      setBillNumber(`INV-${dateStr}-${seq}`);
    } catch (e) {
      console.warn(e);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleItemChange = (index: number, field: keyof LineItem, val: string) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: val };
    setLineItems(updated);
  };

  const handleAddRow = () => {
    setLineItems([...lineItems, { description: '', quantity: '1', unit_price: '0' }]);
  };

  const handleDeleteRow = (index: number) => {
    if (lineItems.length === 1) return;
    setLineItems(lineItems.filter((_, idx) => idx !== index));
  };

  // Computations
  const computedItems = lineItems.map((item) => {
    const q = Number(item.quantity) || 0;
    const p = Number(item.unit_price) || 0;
    return {
      description: item.description,
      quantity: q,
      unit_price: p,
      amount: q * p
    };
  });

  const subtotal = computedItems.reduce((sum, item) => sum + item.amount, 0);
  const taxVal = Number(tax) || 0;
  const discVal = Number(discount) || 0;
  const grandTotal = Math.max(0, subtotal + taxVal - discVal);

  const handleSaveAndGeneratePDF = async () => {
    if (!selectedSiteId) {
      Alert.alert('Validation Error', 'Please select a construction site');
      return;
    }

    if (!vendorName.trim()) {
      Alert.alert('Validation Error', 'Vendor/Client Name is required');
      return;
    }

    const validItems = computedItems.filter((i) => i.description.trim() !== '' && i.quantity > 0);
    if (validItems.length === 0) {
      Alert.alert('Validation Error', 'Please add at least one line item');
      return;
    }

    setIsLoading(true);

    try {
      // Structure exact requested payload
      const payload = {
        site_id: selectedSiteId,
        vendor_name: vendorName.trim(),
        invoice_no: billNumber,
        date: billDate,
        items: validItems,
        subtotal,
        tax: taxVal,
        discount: discVal,
        total: grandTotal,
        status: 'Pending',
        admin_remarks: ''
      };

      await mobileApi.post('/finance/documents', payload);

      Alert.alert('Success', `Bill ${billNumber} compiled & set to Pending Approval`);

      // Reset Form
      const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
      const seq = String(documents.length + 2).padStart(3, '0');
      setBillNumber(`INV-${dateStr}-${seq}`);
      setVendorName('');
      setLineItems([{ description: 'Item Description', quantity: '1', unit_price: '100' }]);

      setActiveTab('list');
      fetchData();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to generate PDF and save bill');
    } finally {
      setIsLoading(false);
    }
  };

  const selectedSite = sites.find((s) => s.id === selectedSiteId);

  return (
    <ScreenContainer>
      {/* Mobile Tab Header */}
      <View style={styles.tabHeader}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'create' && styles.tabBtnActive]}
          onPress={() => setActiveTab('create')}
        >
          <Text style={[styles.tabText, activeTab === 'create' && styles.tabTextActive]}>Accountant Console</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'list' && styles.tabBtnActive]}
          onPress={() => setActiveTab('list')}
        >
          <Text style={[styles.tabText, activeTab === 'list' && styles.tabTextActive]}>Bill History ({documents.length})</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'create' ? (
        <View style={{ flex: 1 }}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
            {/* SELECT SITE SECTION */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Select Site</Text>
              <TouchableOpacity
                style={styles.dropdownBox}
                onPress={() => {
                  const nextIdx = (sites.findIndex((s) => s.id === selectedSiteId) + 1) % (sites.length || 1);
                  if (sites[nextIdx]) setSelectedSiteId(sites[nextIdx].id);
                }}
              >
                <Text style={styles.dropdownLabel}>Choose Site</Text>
                <Text style={styles.dropdownValue}>{selectedSite?.name || 'Choose Site'}</Text>
              </TouchableOpacity>
            </View>

            {/* CREATE BILL SECTION */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Create Bill</Text>

              {/* Bill Number & Date */}
              <View style={styles.row}>
                <View style={styles.col}>
                  <Text style={styles.inputLabel}>Bill Number</Text>
                  <View style={styles.disabledInput}>
                    <Text style={styles.disabledText}>{billNumber}</Text>
                  </View>
                </View>
                <View style={styles.col}>
                  <MobileInput label="Date" value={billDate} onChangeText={setBillDate} />
                </View>
              </View>

              {/* Vendor / Client Name */}
              <MobileInput
                label="Vendor/Client Name"
                placeholder="Vendor/Client Name"
                value={vendorName}
                onChangeText={setVendorName}
              />

              {/* DYNAMIC LINE-ITEM TABLE */}
              <Text style={styles.tableTitle}>Dynamic Line Items</Text>
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.th, { flex: 2 }]}>Item Description</Text>
                <Text style={[styles.th, { flex: 1, textAlign: 'center' }]}>Quantity</Text>
                <Text style={[styles.th, { flex: 1, textAlign: 'right' }]}>Price (₹)</Text>
                <Text style={[styles.th, { flex: 1, textAlign: 'right' }]}>Amount</Text>
              </View>

              {lineItems.map((item, idx) => {
                const amt = (Number(item.quantity) || 0) * (Number(item.unit_price) || 0);
                return (
                  <View key={idx} style={styles.tableRow}>
                    <TextInput
                      style={[styles.tableInput, { flex: 2 }]}
                      placeholder="Description"
                      value={item.description}
                      onChangeText={(v) => handleItemChange(idx, 'description', v)}
                    />
                    <TextInput
                      style={[styles.tableInput, { flex: 1, textAlign: 'center' }]}
                      keyboardType="numeric"
                      value={item.quantity}
                      onChangeText={(v) => handleItemChange(idx, 'quantity', v)}
                    />
                    <TextInput
                      style={[styles.tableInput, { flex: 1, textAlign: 'right' }]}
                      keyboardType="numeric"
                      value={item.unit_price}
                      onChangeText={(v) => handleItemChange(idx, 'unit_price', v)}
                    />
                    <View style={[styles.disabledAmountBox, { flex: 1 }]}>
                      <Text style={styles.amountText}>{amt}</Text>
                    </View>
                  </View>
                );
              })}

              <TouchableOpacity style={styles.addBtn} onPress={handleAddRow}>
                <Text style={styles.addBtnText}>+ Add Row</Text>
              </TouchableOpacity>

              {/* TOTALS SECTION */}
              <View style={styles.totalsBox}>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Subtotal</Text>
                  <Text style={styles.totalVal}>₹{subtotal}</Text>
                </View>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Tax</Text>
                  <TextInput style={styles.miniInput} keyboardType="numeric" value={tax} onChangeText={setTax} />
                </View>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Discount</Text>
                  <TextInput style={styles.miniInput} keyboardType="numeric" value={discount} onChangeText={setDiscount} />
                </View>
                <View style={[styles.totalRow, { marginTop: 6 }]}>
                  <Text style={styles.grandTotalLabel}>Total Amount</Text>
                  <Text style={styles.grandTotalVal}>₹{grandTotal}</Text>
                </View>
              </View>
            </View>
          </ScrollView>

          {/* STICKY BOTTOM PRIMARY ACTION BUTTON */}
          <View style={styles.stickyFooter}>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveAndGeneratePDF} disabled={isLoading}>
              <Text style={styles.saveBtnText}>📄 Save & Generate PDF</Text>
            </TouchableOpacity>
            <Text style={styles.footerCaption}>Draft Saved Locally</Text>
          </View>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {documents.map((doc) => (
            <View key={doc.id} style={styles.docCard}>
              <View style={styles.docHeader}>
                <Text style={styles.docNumber}>{doc.invoice_no || doc.doc_number}</Text>
                <Text style={[styles.statusBadge, doc.status === 'Approved' ? styles.statusApproved : styles.statusPending]}>
                  {doc.status}
                </Text>
              </View>
              <Text style={styles.docVendor}>{doc.vendor_name || 'Vendor'}</Text>
              <Text style={styles.docSite}>{doc.site_name || 'Construction Site'}</Text>
              <Text style={styles.docAmount}>₹{doc.total || doc.total_amount}</Text>
              {doc.admin_remarks ? <Text style={styles.docRemark}>Remark: {doc.admin_remarks}</Text> : null}
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
    marginBottom: 12,
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
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 10
  },
  dropdownBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#cbd5e1'
  },
  dropdownLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase'
  },
  dropdownValue: {
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
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 4
  },
  disabledInput: {
    backgroundColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#cbd5e1'
  },
  disabledText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569'
  },
  tableTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#334155',
    marginTop: 10,
    marginBottom: 6
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 6,
    marginBottom: 6
  },
  th: {
    fontSize: 10,
    fontWeight: '800',
    color: '#475569'
  },
  tableRow: {
    flexDirection: 'row',
    marginBottom: 6,
    alignItems: 'center'
  },
  tableInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 12,
    marginRight: 4
  },
  disabledAmountBox: {
    backgroundColor: '#e2e8f0',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 8,
    alignItems: 'flex-end',
    justifyContent: 'center'
  },
  amountText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#334155'
  },
  addBtn: {
    backgroundColor: '#f1f5f9',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#cbd5e1'
  },
  addBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a'
  },
  totalsBox: {
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    alignItems: 'flex-end'
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '60%',
    marginVertical: 2,
    alignItems: 'center'
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569'
  },
  totalVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a'
  },
  miniInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    fontSize: 12,
    width: 60,
    textAlign: 'right'
  },
  grandTotalLabel: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0284c7'
  },
  grandTotalVal: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0284c7'
  },
  stickyFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#0f172a',
    padding: 12,
    alignItems: 'center',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16
  },
  saveBtn: {
    backgroundColor: '#0284c7',
    width: '100%',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center'
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff'
  },
  footerCaption: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 4
  },
  docCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  docHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  docNumber: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0284c7'
  },
  statusBadge: {
    fontSize: 10,
    fontWeight: '800',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: 'hidden'
  },
  statusApproved: {
    backgroundColor: '#dcfce7',
    color: '#15803d'
  },
  statusPending: {
    backgroundColor: '#fef3c7',
    color: '#b45309'
  },
  docVendor: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 4
  },
  docSite: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2
  },
  docAmount: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0284c7',
    marginTop: 6
  },
  docRemark: {
    fontSize: 11,
    fontStyle: 'italic',
    color: '#ef4444',
    marginTop: 4
  }
});
