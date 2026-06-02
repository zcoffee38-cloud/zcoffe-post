import { useEffect, useState } from 'react';
import { BarChart2, TrendingUp, DollarSign, ShoppingBag, Award, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { formatCurrency, formatDateTime, getImageUrl } from '../lib/utils';
import api from '../api';

function DateFilter({ startDate, endDate, onChange }) {
  return (
    <div className="flex gap-2 items-center flex-wrap">
      <div className="flex items-center gap-2">
        <label className="text-sm text-muted-foreground">Dari:</label>
        <input
          type="date"
          value={startDate}
          onChange={e => onChange('startDate', e.target.value)}
          className="h-9 px-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>
      <div className="flex items-center gap-2">
        <label className="text-sm text-muted-foreground">Sampai:</label>
        <input
          type="date"
          value={endDate}
          onChange={e => onChange('endDate', e.target.value)}
          className="h-9 px-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>
    </div>
  );
}

const paymentLabels = { cash: 'Tunai', qris: 'QRIS', transfer: 'Transfer' };
const paymentColors = { cash: 'success', qris: 'default', transfer: 'secondary' };

export default function LaporanPage() {
  const today = new Date().toISOString().slice(0, 10);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const [startDate, setStartDate] = useState(thirtyDaysAgo);
  const [endDate, setEndDate] = useState(today);
  const [salesData, setSalesData] = useState(null);
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const handleDateChange = (key, val) => {
    if (key === 'startDate') setStartDate(val);
    else setEndDate(val);
  };

  const fetchAll = async () => {
    setLoading(true);
    try {
      const params = { startDate, endDate };
      const [salesRes, topRes] = await Promise.all([
        api.get('/reports/sales', { params }),
        api.get('/reports/top-products', { params: { ...params, limit: 10 } }),
      ]);
      setSalesData(salesRes.data.data);
      setTopProducts(topRes.data.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, [startDate, endDate]);

  const maxRevenue = Math.max(...(topProducts.map(p => p.totalRevenue || 0)), 1);

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Laporan Penjualan</h1>
          <p className="text-muted-foreground text-sm">Analisis kinerja bisnis Z Coffee</p>
        </div>
        <DateFilter startDate={startDate} endDate={endDate} onChange={handleDateChange} />
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {loading ? Array(3).fill(0).map((_, i) => (
          <Card key={i}><CardContent className="p-6"><Skeleton className="h-4 w-24 mb-3" /><Skeleton className="h-8 w-36" /></CardContent></Card>
        )) : (
          <>
            <Card>
              <CardContent className="p-6 flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Pendapatan</p>
                  <p className="text-2xl font-bold">{formatCurrency(salesData?.summary?.totalRevenue || 0)}</p>
                </div>
                <div className="p-3 rounded-xl bg-green-500"><DollarSign className="h-5 w-5 text-white" /></div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Laba Bersih</p>
                  <p className="text-2xl font-bold">{formatCurrency(salesData?.summary?.totalProfit || 0)}</p>
                </div>
                <div className="p-3 rounded-xl bg-blue-500"><TrendingUp className="h-5 w-5 text-white" /></div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Transaksi</p>
                  <p className="text-2xl font-bold">{salesData?.summary?.totalTransactions || 0}</p>
                </div>
                <div className="p-3 rounded-xl bg-coffee-600"><ShoppingBag className="h-5 w-5 text-white" /></div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Award className="h-5 w-5 text-coffee-600" /> Produk Terlaris
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">{Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-12 rounded-xl" />)}</div>
            ) : topProducts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">Belum ada data</div>
            ) : (
              <div className="space-y-3">
                {topProducts.map((p, idx) => (
                  <div key={p.productId} className="flex items-center gap-3">
                    <span className="w-6 text-center text-sm font-bold text-muted-foreground">{idx + 1}</span>
                    <div className="w-9 h-9 rounded-xl bg-muted overflow-hidden shrink-0">
                      {p.image ? <img src={getImageUrl(p.image)} alt={p.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-lg">☕</div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium text-sm truncate">{p.name}</p>
                        <span className="text-xs text-muted-foreground shrink-0 ml-2">{p.totalQty} terjual</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-coffee-600 rounded-full transition-all duration-500" style={{ width: `${((p.totalRevenue || 0) / maxRevenue) * 100}%` }} />
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-coffee-600 dark:text-coffee-400 w-24 text-right">{formatCurrency(p.totalRevenue || 0)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="h-5 w-5 text-coffee-600" /> Transaksi Terbaru
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">{Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>
            ) : !salesData?.transactions?.length ? (
              <div className="text-center py-8 text-muted-foreground text-sm">Belum ada transaksi</div>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                {salesData.transactions.slice(0, 20).map(t => (
                  <div key={t.id} className="flex items-center gap-3 p-3 rounded-xl border bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm font-mono">{t.invoiceNumber}</p>
                      <p className="text-xs text-muted-foreground">{formatDateTime(t.createdAt)} · {t.createdBy?.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sm">{formatCurrency(t.total)}</p>
                      <Badge variant={paymentColors[t.paymentMethod]} className="text-[10px] py-0">
                        {paymentLabels[t.paymentMethod]}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
