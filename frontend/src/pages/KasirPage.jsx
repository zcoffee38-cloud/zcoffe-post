import { useEffect, useState, useCallback } from 'react';
import { Search, Plus, Minus, Trash2, ShoppingCart, CreditCard, Banknote, Loader2, X, QrCode, CheckCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Card, CardContent } from '../components/ui/card';
import { Skeleton } from '../components/ui/skeleton';
import { formatCurrency, getImageUrl, cn } from '../lib/utils';
import { useToast } from '../components/ui/toaster';
import useCartStore from '../store/cartStore';
import api from '../api';

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Tunai', icon: Banknote },
  { value: 'qris', label: 'QRIS', icon: QrCode },
  { value: 'transfer', label: 'Transfer', icon: CreditCard },
];

function ProductCard({ product, onAdd }) {
  const inCart = useCartStore(s => s.items.find(i => i.id === product.id));
  return (
    <button
      onClick={() => product.isAvailable && product.stock > 0 && onAdd(product)}
      disabled={!product.isAvailable || product.stock === 0}
      className={cn(
        'group relative rounded-2xl border bg-card text-left transition-all duration-200 overflow-hidden',
        'hover:shadow-md hover:border-coffee-300 dark:hover:border-coffee-700 active:scale-[0.98]',
        (!product.isAvailable || product.stock === 0) && 'opacity-50 cursor-not-allowed',
        inCart && 'border-coffee-400 dark:border-coffee-600 ring-1 ring-coffee-400/50'
      )}
    >
      <div className="aspect-square bg-muted overflow-hidden">
        {product.image
          ? <img src={getImageUrl(product.image)} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          : <div className="w-full h-full flex items-center justify-center text-4xl">☕</div>
        }
      </div>
      <div className="p-3">
        <p className="font-semibold text-sm leading-tight line-clamp-2 mb-1">{product.name}</p>
        <p className="text-coffee-600 dark:text-coffee-400 font-bold text-sm">{formatCurrency(product.price)}</p>
        <div className="flex items-center justify-between mt-1.5">
          <span className="text-xs text-muted-foreground">Stok: {product.stock}</span>
          {(!product.isAvailable || product.stock === 0) && (
            <Badge variant="destructive" className="text-[10px] py-0">Habis</Badge>
          )}
        </div>
      </div>
      {inCart && (
        <div className="absolute top-2 right-2 bg-coffee-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold shadow">
          {inCart.qty}
        </div>
      )}
    </button>
  );
}

function PaymentModal({ total, onClose, onSuccess }) {
  const [method, setMethod] = useState('cash');
  const [cashInput, setCashInput] = useState('');
  const [loading, setLoading] = useState(false);
  const items = useCartStore(s => s.items);
  const clearCart = useCartStore(s => s.clearCart);
  const { toast } = useToast();

  const cashAmount = parseInt(cashInput.replace(/\D/g, '')) || 0;
  const change = cashAmount - total;

  const handlePay = async () => {
    if (method === 'cash' && cashAmount < total) {
      toast({ title: 'Uang kurang', description: 'Jumlah tunai tidak mencukupi', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const payload = {
        items: items.map(i => ({ productId: i.id, qty: i.qty })),
        paymentMethod: method,
        ...(method === 'cash' && { cashAmount }),
      };
      const { data } = await api.post('/transactions', payload);
      clearCart();
      toast({ title: 'Transaksi berhasil!', description: `No. Antrian: ${data.data.queue.queueNumber}`, variant: 'success' });
      onSuccess(data.data);
    } catch (err) {
      toast({ title: 'Transaksi gagal', description: err.response?.data?.message || 'Terjadi kesalahan', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-card rounded-2xl border w-full max-w-md p-6 animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold">Pembayaran</h2>
          <button onClick={onClose} className="p-1 rounded-lg text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>

        <div className="p-4 rounded-xl bg-muted mb-5 text-center">
          <p className="text-sm text-muted-foreground mb-1">Total Pembayaran</p>
          <p className="text-3xl font-bold text-coffee-700 dark:text-coffee-400">{formatCurrency(total)}</p>
        </div>

        <div className="mb-4">
          <p className="text-sm font-medium mb-2">Metode Pembayaran</p>
          <div className="grid grid-cols-3 gap-2">
            {PAYMENT_METHODS.map(m => (
              <button
                key={m.value}
                onClick={() => setMethod(m.value)}
                className={cn(
                  'flex flex-col items-center gap-1.5 p-3 rounded-xl border text-sm font-medium transition-all',
                  method === m.value
                    ? 'border-coffee-500 bg-coffee-50 dark:bg-coffee-950 text-coffee-700 dark:text-coffee-300'
                    : 'border-border hover:bg-muted'
                )}
              >
                <m.icon className="h-5 w-5" />
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {method === 'cash' && (
          <div className="mb-4 space-y-2">
            <label className="text-sm font-medium">Uang Diterima</label>
            <Input
              placeholder="0"
              value={cashInput}
              onChange={(e) => {
                const raw = e.target.value.replace(/\D/g, '');
                setCashInput(raw ? parseInt(raw).toLocaleString('id-ID') : '');
              }}
              className="text-lg font-mono"
            />
            {cashAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Kembalian:</span>
                <span className={cn('font-bold', change >= 0 ? 'text-green-600' : 'text-destructive')}>
                  {change >= 0 ? formatCurrency(change) : `Kurang ${formatCurrency(-change)}`}
                </span>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-2 mt-6">
          <Button variant="outline" className="flex-1" onClick={onClose}>Batal</Button>
          <Button className="flex-1" onClick={handlePay} disabled={loading}>
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Memproses...</> : 'Bayar'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function SuccessModal({ result, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl border w-full max-w-sm p-8 text-center animate-fade-in">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-1">Transaksi Berhasil!</h2>
        <p className="text-muted-foreground text-sm mb-6">Invoice: {result.transaction.invoiceNumber}</p>
        <div className="bg-coffee-950 text-cream-50 rounded-2xl p-6 mb-6">
          <p className="text-coffee-300 text-sm mb-1">No. Antrian</p>
          <p className="text-6xl font-bold font-mono">{result.queue.queueNumber}</p>
        </div>
        <Button className="w-full" onClick={onClose}>Transaksi Baru</Button>
      </div>
    </div>
  );
}

export default function KasirPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('');
  const [showPayment, setShowPayment] = useState(false);
  const [successResult, setSuccessResult] = useState(null);

  const items = useCartStore(s => s.items);
  const addItem = useCartStore(s => s.addItem);
  const removeItem = useCartStore(s => s.removeItem);
  const updateQty = useCartStore(s => s.updateQty);
  const total = items.reduce((sum, i) => sum + i.price * i.qty, 0);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit: '100', ...(search && { search }), ...(activeCategory && { categoryId: activeCategory }) };
      const { data } = await api.get('/products', { params });
      setProducts(data.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [search, activeCategory]);

  useEffect(() => {
    api.get('/categories').then(r => setCategories(r.data.data)).catch(console.error);
  }, []);

  useEffect(() => {
    const t = setTimeout(fetchProducts, 300);
    return () => clearTimeout(t);
  }, [fetchProducts]);

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4 animate-fade-in">
      {/* Products panel */}
      <div className="flex-1 flex flex-col min-w-0 gap-4">
        {/* Search + filter */}
        <div className="flex gap-2 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Cari produk..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
          <button
            onClick={() => setActiveCategory('')}
            className={cn('px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all border', !activeCategory ? 'bg-coffee-700 text-cream-50 border-coffee-700' : 'border-border hover:bg-muted')}
          >Semua</button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id === activeCategory ? '' : cat.id)}
              className={cn('px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all border', activeCategory === cat.id ? 'bg-coffee-700 text-cream-50 border-coffee-700' : 'border-border hover:bg-muted')}
            >{cat.name}</button>
          ))}
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {Array(8).fill(0).map((_, i) => (
                <Card key={i}><CardContent className="p-0">
                  <Skeleton className="aspect-square rounded-none rounded-t-2xl" />
                  <div className="p-3 space-y-2"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-4 w-1/2" /></div>
                </CardContent></Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {products.map(p => <ProductCard key={p.id} product={p} onAdd={addItem} />)}
            </div>
          )}
        </div>
      </div>

      {/* Cart */}
      <div className="w-80 shrink-0 flex flex-col bg-card rounded-2xl border overflow-hidden">
        <div className="p-4 border-b flex items-center gap-2">
          <ShoppingCart className="h-5 w-5 text-coffee-600" />
          <h2 className="font-bold">Keranjang</h2>
          {items.length > 0 && <Badge className="ml-auto">{items.reduce((s, i) => s + i.qty, 0)} item</Badge>}
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-8">
              <ShoppingCart className="h-10 w-10 mb-3 opacity-20" />
              <p className="text-sm">Keranjang kosong</p>
              <p className="text-xs">Pilih produk untuk ditambahkan</p>
            </div>
          ) : items.map(item => (
            <div key={item.id} className="flex items-center gap-2 p-2 rounded-xl bg-muted/50">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{item.name}</p>
                <p className="text-xs text-coffee-600 dark:text-coffee-400">{formatCurrency(item.price)}</p>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => updateQty(item.id, item.qty - 1)} className="w-7 h-7 rounded-lg bg-background border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                  <Minus className="h-3 w-3" />
                </button>
                <span className="w-7 text-center text-sm font-bold">{item.qty}</span>
                <button onClick={() => updateQty(item.id, item.qty + 1)} className="w-7 h-7 rounded-lg bg-background border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                  <Plus className="h-3 w-3" />
                </button>
              </div>
              <button onClick={() => removeItem(item.id)} className="p-1 rounded-lg text-destructive/60 hover:text-destructive hover:bg-destructive/10 transition-colors">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>

        {items.length > 0 && (
          <div className="p-4 border-t space-y-3">
            <div className="flex justify-between font-bold">
              <span>Total</span>
              <span className="text-coffee-700 dark:text-coffee-400">{formatCurrency(total)}</span>
            </div>
            <Button className="w-full" size="lg" onClick={() => setShowPayment(true)}>
              <CreditCard className="h-4 w-4" />
              Bayar Sekarang
            </Button>
          </div>
        )}
      </div>

      {showPayment && (
        <PaymentModal
          total={total}
          onClose={() => setShowPayment(false)}
          onSuccess={(result) => { setShowPayment(false); setSuccessResult(result); fetchProducts(); }}
        />
      )}
      {successResult && (
        <SuccessModal result={successResult} onClose={() => setSuccessResult(null)} />
      )}
    </div>
  );
}
