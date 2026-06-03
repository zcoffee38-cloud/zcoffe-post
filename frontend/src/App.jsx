import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { ProtectedRoute } from '@/routes/ProtectedRoute';
import LoginPage from '@/pages/LoginPage';
import DashboardPage from '@/pages/DashboardPage';
import KasirPage from '@/pages/KasirPage';
import AntrianPage from '@/pages/AntrianPage';
import AntrianMonitorPage from '@/pages/AntrianMonitorPage';
import ProdukPage from '@/pages/ProdukPage';
import StokPage from '@/pages/StokPage';
import LaporanPage from '@/pages/LaporanPage';
import PenggunaPage from '@/pages/PenggunaPage';
import PengaturanPage from '@/pages/PengaturanPage';
import RiwayatPage from '@/pages/RiwayatPage';
import KategoriPage from '@/pages/KategoriPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/monitor-antrian" element={<AntrianMonitorPage />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        <Route path="/dashboard" element={
          <ProtectedRoute roles={['admin', 'kasir', 'owner']}>
            <DashboardPage />
          </ProtectedRoute>
        } />
        <Route path="/kasir" element={
          <ProtectedRoute roles={['admin', 'kasir']}>
            <KasirPage />
          </ProtectedRoute>
        } />
        <Route path="/antrian" element={
          <ProtectedRoute roles={['admin', 'kasir']}>
            <AntrianPage />
          </ProtectedRoute>
        } />
        <Route path="/produk" element={
          <ProtectedRoute roles={['admin']}>
            <ProdukPage />
          </ProtectedRoute>
        } />
        <Route path="/stok" element={
          <ProtectedRoute roles={['admin']}>
            <StokPage />
          </ProtectedRoute>
        } />
        <Route path="/laporan" element={
          <ProtectedRoute roles={['admin', 'owner']}>
            <LaporanPage />
          </ProtectedRoute>
        } />
        <Route path="/pengguna" element={
          <ProtectedRoute roles={['admin']}>
            <PenggunaPage />
          </ProtectedRoute>
        } />
        <Route path="/pengaturan" element={
          <ProtectedRoute roles={['admin']}>
            <PengaturanPage />
          </ProtectedRoute>
        } />
        <Route path="/riwayat" element={
          <ProtectedRoute roles={['admin', 'kasir', 'owner']}>
            <RiwayatPage />
          </ProtectedRoute>
        } />
        <Route path="/kategori" element={
          <ProtectedRoute roles={['admin']}>
            <KategoriPage />
          </ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
      <Toaster />
    </BrowserRouter>
  );
}