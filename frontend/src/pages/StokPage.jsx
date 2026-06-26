import { useEffect, useState, useCallback } from 'react';
import { Layers, Search, Plus, Minus, RefreshCw, History, TrendingUp, TrendingDown } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Skeleton } from '../components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { SearchableSelect } from '../components/ui/searchable-select';
import { formatDateTime, cn } from '../lib/utils';
import { useToast } from '../components/ui/toaster';
import api from '../api';

const typeConfig = {
  in:         { label: 'Stok Masuk',    icon: TrendingUp,   color: 'text-green-500',  bg: 'bg-green-500/10' },
  out:        { label: 'Stok Keluar',   icon: TrendingDown, color: 'text-red-500',    bg: 'bg-red-500/10' },
  adjustment: { label: 'Penyesuaian',   icon: RefreshCw,    color: 'text-blue-500',   bg: 'bg-blue-500/10' },
};

function AdjustModal({ products, onClose, onSave }) {
  const [productId, setProductId] = useState('');
  const [type, setType] = useState('in');
  const [qty, setQty] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const selectedProduct = products.find(p => p.id === productId);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!productId || !qty) { toast({ title: 'Lengkapi semua field', variant: 'destructive' }); return; }
    setLoading(true);
    try {
      await api.post('/stock/adjust', { productId, type, qty: Number(qty), note });
      toast({ title: 'Stok berhasil diperbarui', variant: 'success' });
      onSave();
    } catch (err) {
      toast({ title: 'Gagal update stok', description: err.response?.data?.message, variant: 'destructive' });
    } finally { setLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Produk</label>
        <SearchableSelect
          value={productId}
          onValueChange={setProductId}
          placeholder="Pilih produk"
          items={products.map(p => ({
            value: p.id,
            label: p.name,
            labelNode: (
              <>
                {p.name} <span className="text-muted-foreground">(Stok: {p.stock})</span>
              </>
            )
          }))}
        />
        {selectedProduct && (
          <p className="text-xs text-muted-foreground">Stok saat ini: <span className="font-semibold text-foreground">{selectedProduct.stock}</span></p>
        )}
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">Jenis Penyesuaian</label>
        <div className="grid grid-cols-3 gap-2">
          {Object.entries(typeConfig).map(([val, cfg]) => (
            <button
              key={val}
              type="button"
              onClick={() => setType(val)}
              className={cn(
                'p-2.5 rounded-xl border text-xs font-semibold transition-all flex flex-col items-center gap-1',
                type === val ? `border-current ${cfg.color} ${cfg.bg}` : 'border-border hover:bg-muted'
              )}
            >
              <cfg.icon className="h-4 w-4" />
              {cfg.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">{type === 'adjustment' ? 'Stok Baru' : 'Jumlah'}</label>
          <Input type="number" value={qty} onChange={e => setQty(e.target.value)} placeholder="0" min="0" required />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Catatan</label>
          <Input value={note} onChange={e => setNote(e.target.value)} placeholder="Opsional" />
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Batal</Button>
        <Button type="submit" className="flex-1" disabled={loading}>
          {loading ? 'Menyimpan...' : 'Simpan'}
        </Button>
      </div>
    </form>
  );
}

export default function StokPage() {
  const [products, setProducts] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAdjust, setShowAdjust] = useState(false);
  const [logPage, setLogPage] = useState(1);
  const [logMeta, setLogMeta] = useState({});

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit: '100', ...(search && { search }) };
      const { data } = await api.get('/products', { params });
      setProducts(data.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [search]);

  const fetchLogs = useCallback(async () => {
    setLogsLoading(true);
    try {
      const { data } = await api.get('/stock/logs', { params: { page: logPage, limit: 20 } });
      setLogs(data.data);
      setLogMeta(data.meta || {});
    } catch (e) { console.error(e); }
    finally { setLogsLoading(false); }
  }, [logPage]);

  useEffect(() => { const t = setTimeout(fetchProducts, 300); return () => clearTimeout(t); }, [fetchProducts]);
  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const lowStock = products.filter(p => p.stock <= 5);

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Stok Opname</h1>
          <p className="text-muted-foreground text-sm">Kelola dan pantau stok produk</p>
        </div>
        <Button onClick={() => setShowAdjust(true)}>
          <RefreshCw className="h-4 w-4" /> Sesuaikan Stok
        </Button>
      </div>

      {lowStock.length > 0 && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
          <Layers className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-amber-700 dark:text-amber-400 text-sm">Stok Hampir Habis</p>
            <p className="text-sm text-amber-600 dark:text-amber-500 mt-0.5">
              {lowStock.map(p => `${p.name} (${p.stock})`).join(', ')}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stock list */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Daftar Stok Produk</h2>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Cari produk..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {loading ? Array(8).fill(0).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />) :
              products.map(p => {
                const level = p.stock === 0 ? 'destructive' : p.stock <= 5 ? 'warning' : 'success';
                return (
                  <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl border bg-card hover:bg-muted/30 transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-muted overflow-hidden shrink-0">
                      {p.image ? <img src={`${import.meta.env.VITE_UPLOAD_URL || 'http://localhost:5000/uploads'}/${p.image}`} alt={p.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center">☕</div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.category?.name}</p>
                    </div>
                    <Badge variant={level} className="text-sm font-bold px-3">{p.stock}</Badge>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Logs */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-muted-foreground" />
            <h2 className="font-semibold">Riwayat Perubahan Stok</h2>
          </div>
          <div className="space-y-2 max-h-[530px] overflow-y-auto pr-1">
            {logsLoading ? Array(8).fill(0).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />) :
              logs.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <History className="h-8 w-8 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">Belum ada riwayat stok</p>
                </div>
              ) : logs.map(log => {
                const cfg = typeConfig[log.type];
                return (
                  <div key={log.id} className="flex items-center gap-3 p-3 rounded-xl border bg-card">
                    <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0', cfg.bg)}>
                      <cfg.icon className={cn('h-4 w-4', cfg.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{log.product?.name}</p>
                      <p className="text-xs text-muted-foreground">{log.note || cfg.label} · {formatDateTime(log.createdAt)}</p>
                    </div>
                    <span className={cn('font-bold text-sm tabular-nums', cfg.color)}>
                      {log.type === 'in' ? '+' : log.type === 'out' ? '-' : '='}{log.qty}
                    </span>
                  </div>
                );
              })}
          </div>
          {logMeta.totalPages > 1 && (
            <div className="flex justify-center gap-2">
              <Button variant="outline" size="sm" disabled={logPage === 1} onClick={() => setLogPage(p => p - 1)}>Sebelumnya</Button>
              <Button variant="outline" size="sm" disabled={logPage >= logMeta.totalPages} onClick={() => setLogPage(p => p + 1)}>Berikutnya</Button>
            </div>
          )}
        </div>
      </div>

      <Dialog open={showAdjust} onOpenChange={v => !v && setShowAdjust(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Sesuaikan Stok</DialogTitle></DialogHeader>
          <AdjustModal
            products={products}
            onClose={() => setShowAdjust(false)}
            onSave={() => { setShowAdjust(false); fetchProducts(); fetchLogs(); }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
