import { useEffect, useState, useCallback } from 'react';
import { Plus, Search, Edit2, Trash2, Loader2, Tags, X } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent } from '../components/ui/card';
import { Skeleton } from '../components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { useToast } from '../components/ui/toaster';
import api from '../api';

function CategoryForm({ category, onSave, onClose }) {
  const [name, setName] = useState(category ? category.name : '');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast({ title: 'Nama kategori wajib diisi', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      if (category) {
        await api.put(`/categories/${category.id}`, { name: name.trim() });
        toast({ title: 'Kategori diperbarui', variant: 'success' });
      } else {
        await api.post('/categories', { name: name.trim() });
        toast({ title: 'Kategori ditambahkan', variant: 'success' });
      }
      onSave();
    } catch (err) {
      const msg = err.response?.data?.message || 'Gagal menyimpan kategori';
      toast({ title: 'Terjadi kesalahan', description: msg, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Nama Kategori *</label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Contoh: Kopi Dingin, Cemilan"
          maxLength={40}
          required
          autoFocus
        />
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
          Batal
        </Button>
        <Button type="submit" className="flex-1" disabled={loading}>
          {loading ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Menyimpan...</>
          ) : category ? (
            'Simpan Perubahan'
          ) : (
            'Tambah Kategori'
          )}
        </Button>
      </div>
    </form>
  );
}

export default function KategoriPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialog, setDialog] = useState(null); // null | 'add' | category obj
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const { toast } = useToast();

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/categories');
      setCategories(data.data);
    } catch (e) {
      console.error(e);
      toast({ title: 'Gagal memuat kategori', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await api.delete(`/categories/${deleteTarget.id}`);
      toast({ title: 'Kategori berhasil dihapus', variant: 'success' });
      setDeleteTarget(null);
      fetchCategories();
    } catch (err) {
      // Check for foreign key constraint / active products
      const description = err.response?.status === 409 || err.response?.data?.message?.includes('foreign key') || err.response?.status === 500
        ? 'Kategori tidak dapat dihapus karena masih digunakan oleh beberapa produk.'
        : err.response?.data?.message || 'Terjadi kesalahan sistem';

      toast({
        title: 'Gagal menghapus kategori',
        description,
        variant: 'destructive',
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  // Local filter
  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5 animate-fade-in pb-12">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Tags className="h-6 w-6 text-coffee-600" />
            Manajemen Kategori
          </h1>
          <p className="text-muted-foreground text-sm">
            {categories.length} kategori terdaftar untuk mengelompokkan produk Anda
          </p>
        </div>
        <Button onClick={() => setDialog('add')} className="gap-1.5">
          <Plus className="h-4 w-4" />
          Tambah Kategori
        </Button>
      </div>

      {/* Filters */}
      <Card className="shadow-sm border-border/60">
        <CardContent className="p-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari nama kategori..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Categories Table/List */}
      <Card className="shadow-sm border-border/60 overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-muted-foreground">
              <thead className="text-xs text-foreground uppercase bg-muted/40 border-b">
                <tr>
                  <th scope="col" className="px-6 py-3.5 font-semibold w-[8%] text-center">No</th>
                  <th scope="col" className="px-6 py-3.5 font-semibold w-[52%]">Nama Kategori</th>
                  <th scope="col" className="px-6 py-3.5 font-semibold w-[20%] text-center">Jumlah Produk</th>
                  <th scope="col" className="px-6 py-3.5 font-semibold w-[20%] text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  Array(4).fill(0).map((_, i) => (
                    <tr key={i} className="bg-card">
                      <td className="px-6 py-4 text-center"><Skeleton className="h-4 w-6 mx-auto" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-48" /></td>
                      <td className="px-6 py-4 text-center"><Skeleton className="h-4 w-8 mx-auto" /></td>
                      <td className="px-6 py-4 text-center"><Skeleton className="h-8 w-24 mx-auto rounded-lg" /></td>
                    </tr>
                  ))
                ) : filteredCategories.length === 0 ? (
                  <tr className="bg-card">
                    <td colSpan={4} className="text-center py-12 text-muted-foreground">
                      <Tags className="h-12 w-12 mx-auto mb-3 opacity-20" />
                      <p>Kategori tidak ditemukan</p>
                    </td>
                  </tr>
                ) : (
                  filteredCategories.map((c, idx) => (
                    <tr key={c.id} className="bg-card hover:bg-muted/10 transition-colors">
                      <td className="px-6 py-4 text-center text-foreground font-medium">{idx + 1}</td>
                      <td className="px-6 py-4 font-semibold text-foreground text-sm">{c.name}</td>
                      <td className="px-6 py-4 text-center text-foreground font-mono">
                        {c._count?.products ?? 0}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDialog(c)}
                            className="h-8 w-8 p-0"
                            title="Edit Kategori"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDeleteTarget(c)}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            title="Hapus Kategori"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add / Edit Dialog */}
      <Dialog open={!!dialog} onOpenChange={(v) => !v && setDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {dialog === 'add' ? 'Tambah Kategori Baru' : 'Edit Kategori'}
            </DialogTitle>
          </DialogHeader>
          {dialog && (
            <CategoryForm
              category={dialog === 'add' ? null : dialog}
              onSave={() => {
                setDialog(null);
                fetchCategories();
              }}
              onClose={() => setDialog(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl border p-6 max-w-sm w-full animate-fade-in">
            <h3 className="font-bold text-lg mb-1">Hapus Kategori?</h3>
            <p className="text-muted-foreground text-sm mb-2">
              Kategori <span className="font-semibold text-foreground">"{deleteTarget.name}"</span> akan dihapus secara permanen.
            </p>
            {deleteTarget._count?.products > 0 && (
              <p className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 p-2 rounded-lg mb-4 font-semibold">
                Peringatan: Kategori ini memiliki {deleteTarget._count.products} produk aktif. Database akan memblokir penghapusan ini.
              </p>
            )}
            <div className="flex gap-2 mt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setDeleteTarget(null)}
                disabled={deleteLoading}
              >
                Batal
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={handleDelete}
                disabled={deleteLoading}
              >
                {deleteLoading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Menghapus...</> : 'Hapus'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
