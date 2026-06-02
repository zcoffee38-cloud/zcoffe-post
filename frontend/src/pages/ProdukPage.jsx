import { useEffect, useState, useCallback } from 'react';
import { Plus, Search, Edit2, Trash2, Package, Loader2, Upload, X, ToggleLeft, ToggleRight } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Card, CardContent } from '../components/ui/card';
import { Skeleton } from '../components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { formatCurrency, getImageUrl, cn } from '../lib/utils';
import { useToast } from '../components/ui/toaster';
import api from '../api';

const emptyForm = { name: '', categoryId: '', price: '', hpp: '', stock: '', isAvailable: true };

function ProductForm({ product, categories, onSave, onClose }) {
  const [form, setForm] = useState(product ? {
    name: product.name, categoryId: product.categoryId, price: product.price,
    hpp: product.hpp, stock: product.stock, isAvailable: product.isAvailable,
  } : emptyForm);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(product?.image ? getImageUrl(product.image) : null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.categoryId || !form.price || !form.hpp) {
      toast({ title: 'Lengkapi semua field wajib', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (imageFile) fd.append('image', imageFile);

      if (product) {
        await api.put(`/products/${product.id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast({ title: 'Produk diperbarui', variant: 'success' });
      } else {
        await api.post('/products', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast({ title: 'Produk ditambahkan', variant: 'success' });
      }
      onSave();
    } catch (err) {
      toast({ title: 'Gagal menyimpan produk', description: err.response?.data?.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Image upload */}
      <div className="flex flex-col items-center gap-3">
        <div
          className="relative w-full h-40 rounded-2xl bg-muted border-2 border-dashed border-border flex items-center justify-center overflow-hidden cursor-pointer hover:bg-muted/70 transition-colors"
          onClick={() => document.getElementById('img-upload').click()}
        >
          {imagePreview ? (
            <>
              <img src={imagePreview} alt="preview" className="w-full h-full object-cover" />
              <button type="button" onClick={(e) => { e.stopPropagation(); setImageFile(null); setImagePreview(null); }}
                className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 hover:bg-black/70">
                <X className="h-3 w-3" />
              </button>
            </>
          ) : (
            <div className="text-center text-muted-foreground">
              <Upload className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">Klik untuk upload foto</p>
              <p className="text-xs opacity-60">JPG, PNG, WebP (max 5MB)</p>
            </div>
          )}
        </div>
        <input id="img-upload" type="file" accept="image/*" className="hidden" onChange={handleImage} />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">Nama Produk *</label>
        <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Contoh: Cappuccino" required />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">Kategori *</label>
        <Select value={form.categoryId} onValueChange={v => setForm(f => ({ ...f, categoryId: v }))}>
          <SelectTrigger><SelectValue placeholder="Pilih kategori" /></SelectTrigger>
          <SelectContent>
            {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Harga Jual *</label>
          <Input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="25000" min="0" required />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">HPP / Modal *</label>
          <Input type="number" value={form.hpp} onChange={e => setForm(f => ({ ...f, hpp: e.target.value }))} placeholder="10000" min="0" required />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Stok</label>
          <Input type="number" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} placeholder="0" min="0" />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Status</label>
          <button
            type="button"
            onClick={() => setForm(f => ({ ...f, isAvailable: !f.isAvailable }))}
            className={cn('flex items-center gap-2 h-10 w-full rounded-xl border px-3 text-sm font-medium transition-colors', form.isAvailable ? 'border-green-500/50 bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400' : 'border-border bg-muted text-muted-foreground')}
          >
            {form.isAvailable ? <><ToggleRight className="h-5 w-5" />Tersedia</> : <><ToggleLeft className="h-5 w-5" />Habis</>}
          </button>
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Batal</Button>
        <Button type="submit" className="flex-1" disabled={loading}>
          {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Menyimpan...</> : product ? 'Simpan Perubahan' : 'Tambah Produk'}
        </Button>
      </div>
    </form>
  );
}

export default function ProdukPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('');
  const [dialog, setDialog] = useState(null); // null | 'add' | product obj
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({});
  const { toast } = useToast();

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 12, ...(search && { search }), ...(activeCategory && { categoryId: activeCategory }) };
      const { data } = await api.get('/products', { params });
      setProducts(data.data);
      setMeta(data.meta || {});
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [page, search, activeCategory]);

  useEffect(() => {
    api.get('/categories').then(r => setCategories(r.data.data));
  }, []);

  useEffect(() => {
    const t = setTimeout(fetchProducts, 300);
    return () => clearTimeout(t);
  }, [fetchProducts]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/products/${deleteTarget.id}`);
      toast({ title: 'Produk dihapus', variant: 'success' });
      setDeleteTarget(null);
      fetchProducts();
    } catch {
      toast({ title: 'Gagal menghapus produk', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Manajemen Produk</h1>
          <p className="text-muted-foreground text-sm">{meta.total || 0} produk tersedia</p>
        </div>
        <Button onClick={() => setDialog('add')}>
          <Plus className="h-4 w-4" /> Tambah Produk
        </Button>
      </div>

      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Cari produk..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="pl-9" />
        </div>
        <Select value={activeCategory} onValueChange={v => { setActiveCategory(v === 'all' ? '' : v); setPage(1); }}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Semua Kategori" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Kategori</SelectItem>
            {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {Array(12).fill(0).map((_, i) => (
            <Card key={i}><CardContent className="p-0">
              <Skeleton className="aspect-square rounded-t-2xl" />
              <div className="p-3 space-y-2"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-3 w-1/2" /></div>
            </CardContent></Card>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Package className="h-12 w-12 mx-auto mb-3 opacity-20" />
          <p>Tidak ada produk ditemukan</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {products.map(product => (
            <Card key={product.id} className="overflow-hidden group">
              <CardContent className="p-0">
                <div className="relative aspect-square bg-muted overflow-hidden">
                  {product.image
                    ? <img src={getImageUrl(product.image)} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    : <div className="w-full h-full flex items-center justify-center text-4xl">☕</div>
                  }
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                    <button onClick={() => setDialog(product)} className="w-9 h-9 rounded-xl bg-white/90 flex items-center justify-center text-foreground hover:bg-white transition-colors shadow">
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button onClick={() => setDeleteTarget(product)} className="w-9 h-9 rounded-xl bg-white/90 flex items-center justify-center text-destructive hover:bg-white transition-colors shadow">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="p-3">
                  <p className="font-semibold text-sm leading-tight line-clamp-2 mb-1">{product.name}</p>
                  <p className="text-xs text-muted-foreground mb-1.5">{product.category?.name}</p>
                  <p className="text-coffee-600 dark:text-coffee-400 font-bold text-sm">{formatCurrency(product.price)}</p>
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-xs text-muted-foreground">Stok: {product.stock}</span>
                    <Badge variant={product.isAvailable ? 'success' : 'destructive'} className="text-[10px] py-0">
                      {product.isAvailable ? 'Tersedia' : 'Habis'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {meta.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Sebelumnya</Button>
          <span className="flex items-center text-sm text-muted-foreground px-2">{page} / {meta.totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= meta.totalPages} onClick={() => setPage(p => p + 1)}>Berikutnya</Button>
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={!!dialog} onOpenChange={v => !v && setDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{dialog === 'add' ? 'Tambah Produk Baru' : 'Edit Produk'}</DialogTitle>
          </DialogHeader>
          {dialog && (
            <ProductForm
              product={dialog === 'add' ? null : dialog}
              categories={categories}
              onSave={() => { setDialog(null); fetchProducts(); }}
              onClose={() => setDialog(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl border p-6 max-w-sm w-full animate-fade-in">
            <h3 className="font-bold text-lg mb-1">Hapus Produk?</h3>
            <p className="text-muted-foreground text-sm mb-5">
              Produk <span className="font-semibold text-foreground">"{deleteTarget.name}"</span> akan dihapus permanen.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setDeleteTarget(null)}>Batal</Button>
              <Button variant="destructive" className="flex-1" onClick={handleDelete}>Hapus</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
