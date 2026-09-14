import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { LoadingState } from '../components/ui/LoadingState';
import { ErrorState } from '../components/ui/ErrorState';
import { Download, FileText, PieChart, BarChart } from 'lucide-react';

export const Reports: React.FC = () => {
  const [purchaseReport, setPurchaseReport] = useState<any>(null);
  const [expenseReport, setExpenseReport] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchReports = async () => {
    try {
      setIsLoading(true);
      setError('');
      const [pRes, eRes]: any[] = await Promise.all([
        api.get('/reports/purchases'),
        api.get('/reports/expenses')
      ]);

      setPurchaseReport(pRes.data);
      setExpenseReport(eRes.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load report metrics');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleExportCSV = (filename: string, rows: any[]) => {
    if (!rows || rows.length === 0) return alert('No data to export');
    const keys = Object.keys(rows[0]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [keys.join(','), ...rows.map((r) => keys.map((k) => `"${r[k] || ''}"`).join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) return <LoadingState message="Aggregating analytical reports..." />;
  if (error) return <ErrorState message={error} onRetry={fetchReports} />;

  const pOverall = purchaseReport?.overall || {};

  return (
    <div className="space-y-6">
      <PageHeader
        title="Management Reports & Analytics"
        description="Comprehensive analytical reporting across Material Purchases, Supplier Accounts, Expenses, and Personnel."
      />

      {/* Financial Purchase Summary Report Card */}
      <Card
        title="Material Purchases & Supplier Breakdown Report"
        subtitle="Aggregated total orders, grand amounts, paid amounts, and outstanding balances."
        action={
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleExportCSV('supplier_purchase_report', purchaseReport?.supplier_breakdown || [])}
            icon={<Download className="w-4 h-4" />}
          >
            Export Supplier Report (CSV)
          </Button>
        }
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-4 bg-slate-50 border rounded-xl">
            <div>
              <span className="text-xs uppercase font-bold text-slate-500">Total Purchase Orders</span>
              <p className="text-2xl font-black text-slate-900">{pOverall.total_purchases_count || 0}</p>
            </div>
            <div>
              <span className="text-xs uppercase font-bold text-slate-500">Grand Total Amount</span>
              <p className="text-2xl font-black text-slate-900">₹{Number(pOverall.total_grand_amount || 0).toLocaleString('en-IN')}</p>
            </div>
            <div>
              <span className="text-xs uppercase font-bold text-emerald-700">Total Paid Amount</span>
              <p className="text-2xl font-black text-emerald-700">₹{Number(pOverall.total_paid_amount || 0).toLocaleString('en-IN')}</p>
            </div>
            <div>
              <span className="text-xs uppercase font-bold text-rose-700">Total Outstanding</span>
              <p className="text-2xl font-black text-rose-700">₹{Number(pOverall.total_outstanding_amount || 0).toLocaleString('en-IN')}</p>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">Supplier-wise Purchase Breakdown</h4>
            <div className="overflow-x-auto border rounded-xl">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-100 uppercase font-semibold text-slate-500 border-b">
                  <tr>
                    <th className="px-4 py-3">Supplier Firm</th>
                    <th className="px-4 py-3">PO Count</th>
                    <th className="px-4 py-3">Grand Total</th>
                    <th className="px-4 py-3">Paid Amount</th>
                    <th className="px-4 py-3">Outstanding</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {(purchaseReport?.supplier_breakdown || []).map((s: any, idx: number) => (
                    <tr key={idx}>
                      <td className="px-4 py-3 font-bold text-slate-900">{s.company_name}</td>
                      <td className="px-4 py-3 font-semibold">{s.order_count} POs</td>
                      <td className="px-4 py-3 font-bold text-slate-900">₹{Number(s.grand_total).toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3 font-semibold text-emerald-700">₹{Number(s.paid_amount).toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3 font-bold text-rose-700">₹{Number(s.outstanding_amount).toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </Card>

      {/* Expenses Breakdown Report Card */}
      <Card
        title="Category-Wise Expense Breakdown Report"
        subtitle="Distribution of financial expenses across site categories."
        action={
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleExportCSV('expense_category_report', expenseReport?.category_breakdown || [])}
            icon={<Download className="w-4 h-4" />}
          >
            Export Expense Report (CSV)
          </Button>
        }
      >
        <div className="overflow-x-auto border rounded-xl">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-100 uppercase font-semibold text-slate-500 border-b">
              <tr>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Number of Transactions</th>
                <th className="px-4 py-3">Total Amount Spent</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {(expenseReport?.category_breakdown || []).map((c: any, idx: number) => (
                <tr key={idx}>
                  <td className="px-4 py-3 font-bold text-brand-700">{c.category}</td>
                  <td className="px-4 py-3 font-medium">{c.count} entries</td>
                  <td className="px-4 py-3 font-bold text-slate-900">₹{Number(c.total_amount).toLocaleString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
