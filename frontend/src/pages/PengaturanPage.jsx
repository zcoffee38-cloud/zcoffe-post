import { useEffect, useState } from 'react';
import { Store, Phone, MapPin, AlignCenter, Save, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { useToast } from '../components/ui/toaster';
import useSettingsStore from '../store/settingsStore';

export default function PengaturanPage() {
  const { settings, isLoading, fetchSettings, updateSettings } = useSettingsStore();
  const { toast } = useToast();

  const [form, setForm] = useState({
    shop_name: '',
    shop_address: '',
    shop_phone: '',
    receipt_footer: '',
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    if (settings) {
      setForm({
        shop_name: settings.shop_name || 'Z Coffee',
        shop_address: settings.shop_address || '',
        shop_phone: settings.shop_phone || '',
        receipt_footer: settings.receipt_footer || 'Terima kasih atas kunjungan Anda!',
      });
    }
  }, [settings]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.shop_name.trim()) {
      toast({ title: 'Nama toko wajib diisi', variant: 'destructive' });
      return;
    }
    if (!form.shop_address.trim()) {
      toast({ title: 'Alamat toko wajib diisi', variant: 'destructive' });
      return;
    }

    setSaving(true);
    const res = await updateSettings(form);
    setSaving(false);

    if (res.success) {
      toast({ title: 'Pengaturan berhasil disimpan!', variant: 'success' });
    } else {
      toast({ title: 'Gagal menyimpan pengaturan', description: res.error, variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div>
        <h1 className="text-2xl font-bold">Pengaturan Toko</h1>
        <p className="text-muted-foreground text-sm">Konfigurasi info toko dan format struk belanja</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Form Settings */}
        <div className="lg:col-span-2">
          <Card className="border border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Store className="h-5 w-5 text-coffee-600" />
                Informasi Toko
              </CardTitle>
              <CardDescription>Ubah detail toko untuk disematkan di struk penjualan Anda.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Store className="h-4 w-4 text-muted-foreground" />
                    Nama Toko
                  </label>
                  <Input
                    name="shop_name"
                    value={form.shop_name}
                    onChange={handleChange}
                    placeholder="Contoh: Z Coffee"
                    maxLength={50}
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    Nomor Telepon
                  </label>
                  <Input
                    name="shop_phone"
                    value={form.shop_phone}
                    onChange={handleChange}
                    placeholder="Contoh: 0812-3456-7890"
                    maxLength={20}
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    Alamat Toko
                  </label>
                  <textarea
                    name="shop_address"
                    value={form.shop_address}
                    onChange={handleChange}
                    placeholder="Contoh: Jl. Sudirman No. 10, RT 1/RW 2, Jakarta Pusat"
                    maxLength={200}
                    rows={3}
                    disabled={isLoading}
                    className="flex min-h-[80px] w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <AlignCenter className="h-4 w-4 text-muted-foreground" />
                    Catatan Kaki Struk (Receipt Footer)
                  </label>
                  <textarea
                    name="receipt_footer"
                    value={form.receipt_footer}
                    onChange={handleChange}
                    placeholder="Contoh: Terima kasih atas kunjungan Anda!"
                    maxLength={150}
                    rows={2}
                    disabled={isLoading}
                    className="flex min-h-[60px] w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <Button type="submit" size="lg" disabled={saving || isLoading} className="w-full sm:w-auto px-6">
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Menyimpan...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Simpan Perubahan
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Receipt Live Preview */}
        <div>
          <div className="sticky top-6">
            <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Pratinjau Struk</h2>
            <div className="bg-white text-black p-5 rounded-2xl shadow-md border border-gray-200/80 font-mono text-xs max-w-[320px] mx-auto select-none">
              <div className="text-center border-b border-dashed border-gray-300 pb-3 mb-3">
                <h3 className="font-bold text-sm uppercase tracking-wide break-words">{form.shop_name || 'Z COFFEE'}</h3>
                {form.shop_phone && <p className="text-[10px] text-gray-600 mt-0.5">Telp: {form.shop_phone}</p>}
                <p className="text-[10px] text-gray-500 mt-1 whitespace-pre-wrap leading-tight break-words">{form.shop_address || 'Jl. Toko Anda Akan Terlihat Di Sini'}</p>
              </div>

              <div className="space-y-1 mb-3 text-[10px] text-gray-600">
                <div className="flex justify-between"><span>No: INV/20260603/001</span><span>03/06/2026</span></div>
                <div className="flex justify-between"><span>Antrian: #012</span><span>Kasir: Admin</span></div>
                <div className="flex justify-between"><span>Pelanggan: Budi</span></div>
              </div>

              <div className="border-b border-dashed border-gray-300 pb-2 mb-2">
                <div className="flex justify-between mb-1">
                  <div className="max-w-[70%]">
                    <strong className="block text-gray-800">Kopi Susu Gula Aren</strong>
                    <span className="text-[10px] text-gray-500">1 x Rp 20.000</span>
                  </div>
                  <strong>Rp 20.000</strong>
                </div>
                <div className="flex justify-between">
                  <div className="max-w-[70%]">
                    <strong className="block text-gray-800">Croissant Cokelat</strong>
                    <span className="text-[10px] text-gray-500">1 x Rp 15.000</span>
                  </div>
                  <strong>Rp 15.000</strong>
                </div>
              </div>

              <div className="space-y-1 text-right text-gray-700 font-semibold border-b border-dashed border-gray-300 pb-2 mb-2">
                <div className="flex justify-between"><span>Total</span><span>Rp 35.000</span></div>
                <div className="flex justify-between text-[10px] font-normal text-gray-500"><span>Metode</span><span>Tunai</span></div>
              </div>

              <div className="text-center pt-2">
                <p className="whitespace-pre-wrap leading-tight text-gray-600 text-[10px] italic">{form.receipt_footer || 'Terima kasih atas kunjungan Anda'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
