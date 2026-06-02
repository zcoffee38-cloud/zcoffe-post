import { Navigate } from 'react-router-dom';
import useAuthStore from '@/store/authStore';
import { MainLayout } from '@/components/layouts/MainLayout';

export function ProtectedRoute({ children, roles }) {
  const { user, token } = useAuthStore();

  if (!token || !user) return <Navigate to="/login" replace />;

  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;

  return <MainLayout>{children}</MainLayout>;
}