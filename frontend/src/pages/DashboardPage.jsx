import { useEffect, useState } from 'react';
import { TrendingUp, ShoppingBag, DollarSign, Clock, Award } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Skeleton } from '../components/ui/skeleton';
import { Badge } from '../components/ui/badge';
import { formatCurrency, getImageUrl } from '../lib/utils';
import api from '../api';

function StatCard({ title, value, icon: Icon, color, sub }) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground font-medium mb-1">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
          </div>
          <div className={`p-3 rounded-xl ${color}`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatSkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between">
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-36" />
          </div>
          <Skeleton className="h-11 w-11 rounded-xl" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/reports/dashboard')
      .then(r => setData(r.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm">Ringkasan operasional hari ini</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {loading ? (
          Array(4).fill(0).map((_, i) => <StatSkeleton key={i} />)
        ) : (
          <>
            <StatCard title="Penjualan Hari Ini" value={formatCurrency(data?.todaySales || 0)} icon={DollarSign} color="bg-green-500" sub="Total pendapatan" />
            <StatCard title="Total Transaksi" value={data?.todayTransactions || 0} icon={ShoppingBag} color="bg-coffee-600" sub="Transaksi hari ini" />
            <StatCard title="Total Laba" value={formatCurrency(data?.todayProfit || 0)} icon={TrendingUp} color="bg-blue-500" sub="Laba bersih hari ini" />
            <StatCard title="Antrian Aktif" value={data?.activeQueues || 0} icon={Clock} color="bg-amber-500" sub="Menunggu & diproses" />
          </>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-coffee-600" />
            Produk Terlaris Hari Ini
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array(5).fill(0).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-xl" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                  <Skeleton className="h-6 w-12 rounded-full" />
                </div>
              ))}
            </div>
          ) : data?.topProducts?.length > 0 ? (
            <div className="space-y-3">
              {data.topProducts.map((product, idx) => (
                <div key={product.productId} className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-coffee-100 dark:bg-coffee-900 text-coffee-700 dark:text-coffee-300 font-bold text-sm shrink-0">
                    {idx + 1}
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-muted overflow-hidden shrink-0">
                    {product.image
                      ? <img src={getImageUrl(product.image)} alt={product.name} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-lg">☕</div>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{product.name}</p>
                  </div>
                  <Badge variant="default">{product.totalQty} terjual</Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <ShoppingBag className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm">Belum ada transaksi hari ini</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
