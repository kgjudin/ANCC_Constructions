import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView } from 'react-native';
import { ScreenContainer } from '../components/ScreenContainer';
import { MobileInput } from '../components/Input';
import { MobileButton } from '../components/Button';
import { mobileApi } from '../config/api';

export const PurchaseEntryScreen: React.FC = () => {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState('10');
  const [unitRate, setUnitRate] = useState('420');
  const [paidAmount, setPaidAmount] = useState('0');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const fetchMasters = async () => {
    try {
      const [sRes, pRes]: any[] = await Promise.all([
        mobileApi.get('/suppliers'),
        mobileApi.get('/products')
      ]);
      const sItems = sRes.data?.items || [];
      const pItems = pRes.data?.items || [];
      setSuppliers(sItems);
      setProducts(pItems);
      if (sItems.length > 0) setSelectedSupplierId(sItems[0].id);
      if (pItems.length > 0) {
        setSelectedProductId(pItems[0].id);
        setUnitRate(String(pItems[0].standard_rate));
      }
    } catch (e) {
      console.warn(e);
    }
  };

  useEffect(() => {
    fetchMasters();
  }, []);

  const handleCreatePurchase = async () => {
    if (!selectedSupplierId || !selectedProductId) {
      Alert.alert('Validation Error', 'Please select a supplier and a product');
      return;
    }

    const qty = Number(quantity);
    const rate = Number(unitRate);

    if (qty <= 0 || rate < 0) {
      Alert.alert('Validation Error', 'Invalid quantity or unit rate');
      return;
    }

    setIsLoading(true);

    try {
      const selectedProd = products.find((p) => p.id === selectedProductId);

      await mobileApi.post('/purchases', {
        supplier_id: selectedSupplierId,
        purchase_date: new Date().toISOString().split('T')[0],
        paid_amount: Number(paidAmount),
        invoice_number: invoiceNumber,
        items: [
          {
            product_id: selectedProductId,
            quantity: qty,
            unit: selectedProd?.unit || 'Bags',
            unit_rate: rate,
            discount: 0,
            tax: 0,
            quality_status: 'Approved'
          }
        ]
      });

      Alert.alert('Purchase Order Saved', 'The purchase record was logged with automatic employee attribution');
      setQuantity('10');
      setInvoiceNumber('');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to submit purchase order');
    } finally {
      setIsLoading(false);
    }
  };

  const selectedProd = products.find((p) => p.id === selectedProductId);
  const calculatedSubtotal = (Number(quantity) || 0) * (Number(unitRate) || 0);

  return (
    <ScreenContainer>
      <View style={styles.card}>
        <Text style={styles.title}>Field Material Purchase Log</Text>

        <MobileInput
          label="Invoice / Bill Number"
          placeholder="e.g. INV-12345"
          value={invoiceNumber}
          onChangeText={setInvoiceNumber}
        />

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Selected Supplier:</Text>
          <Text style={styles.fieldValue}>
            {suppliers.find((s) => s.id === selectedSupplierId)?.company_name || 'Select Supplier'}
          </Text>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Selected Product:</Text>
          <Text style={styles.fieldValue}>
            {selectedProd?.name ? `${selectedProd.name} (${selectedProd.unit})` : 'Select Product'}
          </Text>
        </View>

        <View style={styles.row}>
          <View style={styles.col}>
            <MobileInput
              label="Quantity"
              keyboardType="numeric"
              value={quantity}
              onChangeText={setQuantity}
            />
          </View>
          <View style={styles.col}>
            <MobileInput
              label="Rate (₹)"
              keyboardType="numeric"
              value={unitRate}
              onChangeText={setUnitRate}
            />
          </View>
        </View>

        <MobileInput
          label="Initial Paid Amount (₹)"
          keyboardType="numeric"
          value={paidAmount}
          onChangeText={setPaidAmount}
        />

        <View style={styles.totalBox}>
          <Text style={styles.totalLabel}>Calculated Grand Total:</Text>
          <Text style={styles.totalValue}>₹{calculatedSubtotal.toFixed(2)}</Text>
        </View>

        <MobileButton
          title="Submit Field Purchase Order"
          onPress={handleCreatePurchase}
          isLoading={isLoading}
        />
      </View>
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
  fieldGroup: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 12,
    marginVertical: 6,
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
  totalBox: {
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
    padding: 14,
    marginVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0369a1'
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0369a1'
  }
});
