import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Coffee, Eye, EyeOff, Loader2 } from 'lucide-react';
import useAuthStore from '@/store/authStore';
import { useToast } from '@/components/ui/toaster';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function LoginPage() {
  const { user, login, isLoading } = useAuthStore();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);

  if (user) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await login(email, password);
    if (!result.success) {
      toast({ title: 'Login Gagal', description: result.error, variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left — brand */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-coffee-950 p-12 relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-coffee-800/40" />
        <div className="absolute -bottom-32 -right-16 w-80 h-80 rounded-full bg-coffee-700/30" />
        <div className="absolute top-1/2 -translate-y-1/2 right-0 w-48 h-96 rounded-l-full bg-coffee-800/20" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-coffee-600 flex items-center justify-center">
            <Coffee className="h-5 w-5 text-cream-50" />
          </div>
          <span className="font-display text-2xl font-bold text-cream-100">Z Coffee</span>
        </div>

        <div className="relative z-10">
          <h2 className="font-display text-5xl font-bold text-cream-100 leading-tight mb-4">
            Selamat<br />Datang<br />Kembali.
          </h2>
          <p className="text-coffee-300 text-lg">
            Sistem kasir modern untuk<br />operasional Z Coffee.
          </p>
        </div>
      </div>

      {/* Right — form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-10 lg:hidden">
            <div className="w-9 h-9 rounded-xl bg-coffee-700 flex items-center justify-center">
              <Coffee className="h-4 w-4 text-cream-50" />
            </div>
            <span className="font-display text-xl font-bold text-coffee-800 dark:text-coffee-300">Z Coffee</span>
          </div>

          <h1 className="text-2xl font-bold mb-1">Masuk ke Sistem</h1>
          <p className="text-muted-foreground text-sm mb-8">Gunakan akun yang telah diberikan admin.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                placeholder="email@zcoffee.id"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Password</label>
              <div className="relative">
                <Input
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pr-10"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setShowPass(!showPass)}
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
              {isLoading ? <><Loader2 className="h-4 w-4 animate-spin" /> Memproses...</> : 'Masuk'}
            </Button>
          </form>
          
        </div>
      </div>
    </div>
  );
}
