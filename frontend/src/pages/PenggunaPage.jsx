import { useEffect, useState, useCallback } from 'react';
import { Plus, Search, Edit2, Trash2, Users, Loader2, Shield, ShoppingCart, Crown } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Card, CardContent } from '../components/ui/card';
import { Skeleton } from '../components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { formatDateTime } from '../lib/utils';
import { useToast } from '../components/ui/toaster';
import useAuthStore from '../store/authStore';
import api from '../api';

const roleConfig = {
  admin:  { label: 'Admin',  variant: 'destructive', icon: Shield },
  kasir:  { label: 'Kasir',  variant: 'default',     icon: ShoppingCart },
  owner:  { label: 'Owner',  variant: 'warning',     icon: Crown },
};

const emptyForm = { name: '', email: '', password: '', role: 'kasir' };

function UserForm({ user, onSave, onClose }) {
  const [form, setForm] = useState(user ? { name: user.name, email: user.email, password: '', role: user.role } : emptyForm);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user && !form.password) { toast({ title: 'Password wajib diisi', variant: 'destructive' }); return; }
    setLoading(true);
    try {
      const payload = { ...form };
      if (user && !payload.password) delete payload.password;
      if (user) await api.put(`/users/${user.id}`, payload);
      else await api.post('/users', payload);
      toast({ title: user ? 'Pengguna diperbarui' : 'Pengguna ditambahkan', variant: 'success' });
      onSave();
    } catch (err) {
      toast({ title: 'Gagal menyimpan', description: err.response?.data?.message, variant: 'destructive' });
    } finally { setLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Nama Lengkap</label>
        <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Nama pengguna" required />
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Email</label>
        <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@zcoffee.id" required />
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-medium">{user ? 'Password Baru (kosongkan jika tidak diubah)' : 'Password'}</label>
        <Input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="••••••••" minLength={user ? 0 : 6} />
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Role</label>
        <Select value={form.role} onValueChange={v => setForm(f => ({ ...f, role: v }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="kasir">Kasir</SelectItem>
            <SelectItem value="owner">Owner</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex gap-2 pt-2">
        <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Batal</Button>
        <Button type="submit" className="flex-1" disabled={loading}>
          {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Menyimpan...</> : user ? 'Simpan Perubahan' : 'Tambah Pengguna'}
        </Button>
      </div>
    </form>
  );
}

export default function PenggunaPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialog, setDialog] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({});
  const { toast } = useToast();
  const { user: currentUser } = useAuthStore();

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/users', { params: { page, limit: 10, ...(search && { search }) } });
      setUsers(data.data);
      setMeta(data.meta || {});
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [page, search]);

  useEffect(() => { const t = setTimeout(fetchUsers, 300); return () => clearTimeout(t); }, [fetchUsers]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    if (deleteTarget.id === currentUser?.id) {
      toast({ title: 'Tidak dapat menghapus akun sendiri', variant: 'destructive' });
      setDeleteTarget(null); return;
    }
    try {
      await api.delete(`/users/${deleteTarget.id}`);
      toast({ title: 'Pengguna dihapus', variant: 'success' });
      setDeleteTarget(null);
      fetchUsers();
    } catch {
      toast({ title: 'Gagal menghapus pengguna', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Manajemen Pengguna</h1>
          <p className="text-muted-foreground text-sm">{meta.total || 0} pengguna terdaftar</p>
        </div>
        <Button onClick={() => setDialog('add')}><Plus className="h-4 w-4" /> Tambah Pengguna</Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Cari pengguna..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="pl-9" />
      </div>

      {loading ? (
        <div className="space-y-3">{Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}</div>
      ) : users.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Users className="h-12 w-12 mx-auto mb-3 opacity-20" />
          <p>Tidak ada pengguna ditemukan</p>
        </div>
      ) : (
        <div className="space-y-2">
          {users.map(user => {
            const cfg = roleConfig[user.role];
            const RoleIcon = cfg.icon;
            const isCurrentUser = user.id === currentUser?.id;
            return (
              <Card key={user.id} className={isCurrentUser ? 'border-coffee-300 dark:border-coffee-700' : ''}>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-11 h-11 rounded-xl bg-coffee-100 dark:bg-coffee-900 flex items-center justify-center shrink-0">
                    <span className="font-bold text-coffee-700 dark:text-coffee-300 text-lg">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold truncate">{user.name}</p>
                      {isCurrentUser && <Badge variant="outline" className="text-[10px] py-0">Anda</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Bergabung: {formatDateTime(user.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={cfg.variant} className="gap-1">
                      <RoleIcon className="h-3 w-3" /> {cfg.label}
                    </Badge>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDialog(user)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => setDeleteTarget(user)} disabled={isCurrentUser}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {meta.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Sebelumnya</Button>
          <span className="flex items-center text-sm text-muted-foreground px-2">{page} / {meta.totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= meta.totalPages} onClick={() => setPage(p => p + 1)}>Berikutnya</Button>
        </div>
      )}

      <Dialog open={!!dialog} onOpenChange={v => !v && setDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{dialog === 'add' ? 'Tambah Pengguna Baru' : 'Edit Pengguna'}</DialogTitle>
          </DialogHeader>
          {dialog && (
            <UserForm
              user={dialog === 'add' ? null : dialog}
              onSave={() => { setDialog(null); fetchUsers(); }}
              onClose={() => setDialog(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {deleteTarget && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl border p-6 max-w-sm w-full animate-fade-in">
            <h3 className="font-bold text-lg mb-1">Hapus Pengguna?</h3>
            <p className="text-muted-foreground text-sm mb-5">
              Akun <span className="font-semibold text-foreground">"{deleteTarget.name}"</span> akan dihapus permanen.
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
