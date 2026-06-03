import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Package, ShoppingCart, Users, ClipboardList,
  BarChart2, LogOut, Menu, X, Coffee, Moon, Sun, Layers, Settings, History, Tags
} from 'lucide-react';
import useAuthStore from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'kasir', 'owner'] },
  { path: '/kasir', label: 'Kasir', icon: ShoppingCart, roles: ['admin', 'kasir'] },
  { path: '/antrian', label: 'Antrian', icon: ClipboardList, roles: ['admin', 'kasir'] },
  { path: '/produk', label: 'Produk', icon: Package, roles: ['admin'] },
  { path: '/kategori', label: 'Kategori', icon: Tags, roles: ['admin'] },
  { path: '/stok', label: 'Stok', icon: Layers, roles: ['admin'] },
  { path: '/laporan', label: 'Laporan', icon: BarChart2, roles: ['admin', 'owner'] },
  { path: '/riwayat', label: 'Riwayat Pesanan', icon: History, roles: ['admin', 'kasir', 'owner'] },
  { path: '/pengguna', label: 'Pengguna', icon: Users, roles: ['admin'] },
  { path: '/pengaturan', label: 'Pengaturan', icon: Settings, roles: ['admin'] },
];

const roleColors = { admin: 'text-coffee-600', kasir: 'text-blue-600', owner: 'text-purple-600' };

export function MainLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(() => (
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : true
  ));
  const [darkMode, setDarkMode] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const toggleDark = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const allowedNavItems = navItems.filter(item => item.roles.includes(user?.role));
  const closeMobileSidebar = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Tutup menu"
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={closeMobileSidebar}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        'fixed inset-y-0 left-0 z-40 flex flex-col bg-card border-r border-border transition-all duration-300 shrink-0 lg:static',
        sidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full w-64 lg:translate-x-0 lg:w-16'
      )}>
        {/* Logo */}
        <div className="flex items-center gap-3 p-4 border-b border-border">
          <div className="w-8 h-8 rounded-xl bg-coffee-700 flex items-center justify-center shrink-0">
            <Coffee className="h-4 w-4 text-cream-50" />
          </div>
          {sidebarOpen && (
            <div className="overflow-hidden">
              <h1 className="font-display font-bold text-lg leading-none text-coffee-800 dark:text-coffee-300">Z Coffee</h1>
              <p className="text-xs text-muted-foreground">POS System</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {allowedNavItems.map((item) => {
            const active = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                  active
                    ? 'bg-coffee-700 text-cream-50 shadow-sm'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                  !sidebarOpen && 'justify-center'
                )}
                title={!sidebarOpen ? item.label : undefined}
                onClick={closeMobileSidebar}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {sidebarOpen && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User */}
        {sidebarOpen ? (
          <div className="p-3 border-t border-border">
            <div className="flex items-center gap-2 p-2 rounded-xl bg-muted mb-2">
              <div className="w-8 h-8 rounded-lg bg-coffee-200 dark:bg-coffee-800 flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-coffee-800 dark:text-coffee-200">
                  {user?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{user?.name}</p>
                <p className={cn('text-xs capitalize font-medium', roleColors[user?.role] || 'text-muted-foreground')}>{user?.role}</p>
              </div>
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" className="flex-1" onClick={toggleDark}>
                {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              <Button variant="ghost" size="sm" className="flex-1 text-destructive hover:text-destructive" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="p-2 border-t border-border space-y-1">
            <button onClick={toggleDark} className="w-full flex justify-center p-2 rounded-xl text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
              {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            <button onClick={handleLogout} className="w-full flex justify-center p-2 rounded-xl text-destructive hover:bg-destructive/10 transition-colors">
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        )}
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="h-14 flex items-center gap-3 px-4 border-b border-border bg-card shrink-0">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <div className="flex-1" />
          <span className="hidden sm:inline text-sm text-muted-foreground font-mono">
            {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
