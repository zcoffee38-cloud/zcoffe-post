import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

export const formatDate = (date) => {
  return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(new Date(date));
};

export const formatDateTime = (date) => {
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(date));
};

export const getImageUrl = (filename) => {
  if (!filename) return null;
  if (filename.startsWith('http')) return filename;
  return `${import.meta.env.VITE_UPLOAD_URL || 'http://localhost:5000/uploads'}/${filename}`;
};