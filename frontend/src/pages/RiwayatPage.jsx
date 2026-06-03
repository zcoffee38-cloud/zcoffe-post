import { useEffect, useState, useCallback } from 'react';
import { Search, Calendar, Eye, Printer, X, ChevronLeft, ChevronRight, History, CreditCard, QrCode, Banknote, Trash2, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { formatCurrency, formatDateTime } from '../lib/utils';
import useSettingsStore from '../store/settingsStore';
import useAuthStore from '../store/authStore';
import { useToast } from '../components/ui/toaster';
import api from '../api';

const paymentLabels = { cash: 'Tunai', qris: 'QRIS', transfer: 'Transfer' };
const paymentColors = { cash: 'success', qris: 'default', transfer: 'secondary' };
const paymentIcons = { cash: Banknote, qris: QrCode, transfer: CreditCard };

function ReceiptPrintArea({ result, settings }) {
  if (!result) return null;

  const { transaction, queue } = result;
  return (
    <div className="receipt-print-area" aria-hidden="true">
      <div className="receipt">
        <div className="receipt-header">
          <h1>{settings?.shop_name || 'Z Coffee'}</h1>
          {settings?.shop_phone && <p>Telp: {settings.shop_phone}</p>}
          {settings?.shop_address && <p style={{ whiteSpace: 'pre-wrap' }}>{settings.shop_address}</p>}
        </div>
        <div className="receipt-meta">
          <div><span>Invoice</span><strong>{transaction.invoiceNumber}</strong></div>
          <div><span>Antrian</span><strong>#{queue?.queueNumber || '-'}</strong></div>
          <div><span>Pelanggan</span><strong>{transaction.customerName}</strong></div>
          <div><span>Waktu</span><strong>{new Date(transaction.createdAt).toLocaleString('id-ID')}</strong></div>
          <div><span>Kasir</span><strong>{transaction.createdBy?.name || '-'}</strong></div>
        </div>
        <div className="receipt-items">
          {transaction.items.map((item) => (
            <div className="receipt-item" key={item.id}>
              <div>
                <strong>{item.product?.name}</strong>
                <span>{item.qty} x {formatCurrency(item.price)}</span>
              </div>
              <strong>{formatCurrency(item.subtotal)}</strong>
            </div>
          ))}
        </div>
        <div className="receipt-totals">
          <div><span>Total</span><strong>{formatCurrency(transaction.total)}</strong></div>
          <div><span>Metode</span><strong>{paymentLabels[transaction.paymentMethod]}</strong></div>
          {transaction.paymentMethod === 'cash' && (
            <>
              <div><span>Tunai</span><strong>{formatCurrency(transaction.cashAmount || 0)}</strong></div>
              <div><span>Kembali</span><strong>{formatCurrency(transaction.changeAmount || 0)}</strong></div>
            </>
          )}
        </div>
        <p className="receipt-footer">{settings?.receipt_footer || 'Terima kasih'}</p>
      </div>
    </div>
  );
}

export default function RiwayatPage() {
  const [transactions, setTransactions] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const [date, setDate] = useState('');
  const [search, setSearch] = useState('');

  // Selected Transaction for Modal
  const [selectedTx, setSelectedTx] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const { settings, fetchSettings } = useSettingsStore();
  const { user } = useAuthStore();
  const { toast } = useToast();

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await api.delete(`/transactions/${deleteTarget.id}`);
      toast({ title: 'Transaksi berhasil dihapus', variant: 'success' });
      setDeleteTarget(null);
      setSelectedTx(null);
      fetchTransactions();
    } catch (err) {
      const msg = err.response?.data?.message || 'Terjadi kesalahan sistem';
      toast({ title: 'Gagal menghapus transaksi', description: msg, variant: 'destructive' });
    } finally {
      setDeleteLoading(false);
    }
  };

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: page.toString(),
        limit: '10',
        ...(date && { date }),
        ...(search.trim() && { search: search.trim() }),
      };
      const { data } = await api.get('/transactions', { params });
      setTransactions(data.data);
      if (data.meta) {
        setTotal(data.meta.total);
        setTotalPages(data.meta.totalPages || 1);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page, date, search]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1); // reset to page 1 on new search
  };

  const handleDateChange = (e) => {
    setDate(e.target.value);
    setPage(1); // reset to page 1 on date filter change
  };

  const clearFilters = () => {
    setDate('');
    setSearch('');
    setPage(1);
  };

  const handlePrint = () => {
    setTimeout(() => window.print(), 50);
  };

  return (
    <div className="space-y-5 animate-fade-in pb-12">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <History className="h-6 w-6 text-coffee-600" />
          Riwayat Pesanan
        </h1>
        <p className="text-muted-foreground text-sm">Lihat riwayat transaksi penjualan dan cetak ulang struk</p>
      </div>

      {/* Filters Card */}
      <Card className="shadow-sm border-border/60">
        <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto flex-1">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari No. Invoice atau nama pelanggan..."
                value={search}
                onChange={handleSearchChange}
                className="pl-9"
              />
            </div>

            {/* Date Input */}
            <div className="relative flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground hidden sm:inline" />
              <input
                type="date"
                value={date}
                onChange={handleDateChange}
                className="h-10 px-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 transition-all"
              />
            </div>
          </div>

          {(date || search) && (
            <Button variant="ghost" onClick={clearFilters} className="w-full md:w-auto">
              Bersihkan Filter
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card className="shadow-sm border-border/60 overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-muted-foreground">
              <thead className="text-xs text-foreground uppercase bg-muted/40 border-b">
                <tr>
                  <th scope="col" className="px-6 py-3.5 font-semibold">No. Invoice</th>
                  <th scope="col" className="px-6 py-3.5 font-semibold">Tanggal & Waktu</th>
                  <th scope="col" className="px-6 py-3.5 font-semibold">Pelanggan</th>
                  <th scope="col" className="px-6 py-3.5 font-semibold">Kasir</th>
                  <th scope="col" className="px-6 py-3.5 font-semibold">Metode</th>
                  <th scope="col" className="px-6 py-3.5 font-semibold">Total Belanja</th>
                  <th scope="col" className="px-6 py-3.5 font-semibold text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  Array(5).fill(0).map((_, i) => (
                    <tr key={i} className="bg-card">
                      <td className="px-6 py-4"><Skeleton className="h-4 w-28" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-36" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-20" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-5 w-16 rounded-full" /></td>
                      <td className="px-6 py-4 font-semibold"><Skeleton className="h-4 w-24" /></td>
                      <td className="px-6 py-4 text-center"><Skeleton className="h-8 w-16 mx-auto rounded-lg" /></td>
                    </tr>
                  ))
                ) : transactions.length === 0 ? (
                  <tr className="bg-card">
                    <td colSpan={7} className="text-center py-12 text-muted-foreground">
                      <History className="h-12 w-12 mx-auto mb-3 opacity-20" />
                      <p>Tidak ada riwayat transaksi yang ditemukan</p>
                    </td>
                  </tr>
                ) : (
                  transactions.map((t) => (
                    <tr key={t.id} className="bg-card hover:bg-muted/10 transition-colors">
                      <td className="px-6 py-4 font-semibold font-mono text-foreground">{t.invoiceNumber}</td>
                      <td className="px-6 py-4 text-xs">{formatDateTime(t.createdAt)}</td>
                      <td className="px-6 py-4 text-foreground">{t.customerName || '-'}</td>
                      <td className="px-6 py-4">{t.createdBy?.name || '-'}</td>
                      <td className="px-6 py-4">
                        <Badge variant={paymentColors[t.paymentMethod] || 'default'} className="text-[10px] gap-1 py-0.5">
                          {paymentLabels[t.paymentMethod]}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 font-semibold text-coffee-700 dark:text-coffee-400">
                        {formatCurrency(t.total)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedTx(t)}
                            className="h-8 gap-1.5"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            Detail
                          </Button>
                          {(user?.role === 'admin' || user?.role === 'owner') && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setDeleteTarget(t)}
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                              title="Hapus Transaksi"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t">
              <span className="text-xs text-muted-foreground">
                Menampilkan halaman {page} dari {totalPages} ({total} transaksi)
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Sebelumnya
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Berikutnya
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Modal */}
      {selectedTx && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-fade-in max-h-[90vh] flex flex-col">
            <div className="p-4 border-b flex items-center justify-between bg-muted/30">
              <div>
                <h3 className="font-bold text-base">Detail Transaksi</h3>
                <p className="text-xs text-muted-foreground font-mono">{selectedTx.invoiceNumber}</p>
              </div>
              <button
                onClick={() => setSelectedTx(null)}
                className="p-1 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-5">
              {/* Meta Info */}
              <div className="grid grid-cols-2 gap-4 text-sm bg-muted/40 p-4 rounded-xl">
                <div>
                  <p className="text-xs text-muted-foreground">Waktu Transaksi</p>
                  <p className="font-semibold">{formatDateTime(selectedTx.createdAt)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Nomor Antrian</p>
                  <p className="font-semibold text-lg text-coffee-700 dark:text-coffee-400 font-mono">
                    #{selectedTx.queue?.queueNumber || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Nama Pelanggan</p>
                  <p className="font-semibold">{selectedTx.customerName || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Kasir</p>
                  <p className="font-semibold">{selectedTx.createdBy?.name || '-'}</p>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Item Pesanan</h4>
                <div className="divide-y divide-border border rounded-xl overflow-hidden">
                  {selectedTx.items.map((item) => (
                    <div key={item.id} className="flex justify-between items-center p-3 bg-card text-sm">
                      <div className="min-w-0 flex-1 pr-3">
                        <p className="font-medium text-foreground truncate">{item.product?.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.qty} x {formatCurrency(item.price)}
                        </p>
                      </div>
                      <span className="font-semibold shrink-0">{formatCurrency(item.subtotal)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Details */}
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Metode Pembayaran</span>
                  <span className="font-medium flex items-center gap-1.5">
                    {(() => {
                      const Icon = paymentIcons[selectedTx.paymentMethod] || Banknote;
                      return <Icon className="h-4 w-4 text-coffee-600" />;
                    })()}
                    {paymentLabels[selectedTx.paymentMethod]}
                  </span>
                </div>
                {selectedTx.paymentMethod === 'cash' && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Uang Tunai Diterima</span>
                      <span>{formatCurrency(selectedTx.cashAmount || 0)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Uang Kembalian</span>
                      <span className="text-green-600 font-semibold">{formatCurrency(selectedTx.changeAmount || 0)}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between text-base font-bold border-t pt-2 mt-2 text-foreground">
                  <span>Total Belanja</span>
                  <span className="text-coffee-700 dark:text-coffee-400">{formatCurrency(selectedTx.total)}</span>
                </div>
              </div>
            </div>

            <div className="p-4 border-t bg-muted/10 flex gap-2">
              {(user?.role === 'admin' || user?.role === 'owner') && (
                <Button
                  variant="outline"
                  onClick={() => setDeleteTarget(selectedTx)}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30 h-10 px-3"
                  title="Hapus Transaksi"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
              <Button variant="outline" className="flex-1" onClick={() => setSelectedTx(null)}>
                Tutup
              </Button>
              <Button className="flex-1 gap-1.5" onClick={handlePrint}>
                <Printer className="h-4 w-4" />
                Cetak Struk
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Printable Area */}
      {selectedTx && (
        <ReceiptPrintArea
          result={{ transaction: selectedTx, queue: selectedTx.queue }}
          settings={settings}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl border p-6 max-w-sm w-full animate-fade-in shadow-2xl">
            <h3 className="font-bold text-lg mb-1">Hapus Riwayat Transaksi?</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Transaksi <span className="font-semibold text-foreground">"{deleteTarget.invoiceNumber}"</span> akan disembunyikan dari riwayat, laporan, dan antrean aktif. Data tetap tersimpan aman di database.
            </p>
            <div className="flex gap-2">
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
                {deleteLoading ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Menghapus...</>
                ) : (
                  'Hapus'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
