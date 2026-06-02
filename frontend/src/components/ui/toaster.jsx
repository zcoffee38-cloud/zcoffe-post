import useToastStore from '../../store/toastStore';
import { cn } from '../../lib/utils';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

const icons = {
  default: Info,
  success: CheckCircle,
  destructive: AlertCircle,
};

export function Toaster() {
  const { toasts, dismiss } = useToastStore();

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full">
      {toasts.map((toast) => {
        const Icon = icons[toast.variant] || Info;
        return (
          <div
            key={toast.id}
            className={cn(
              'flex items-start gap-3 rounded-xl border p-4 shadow-lg animate-fade-in',
              'bg-card text-card-foreground',
              toast.variant === 'destructive' && 'border-destructive/50 bg-destructive/10',
              toast.variant === 'success' && 'border-green-500/50 bg-green-500/10',
            )}
          >
            <Icon className={cn(
              'h-5 w-5 mt-0.5 shrink-0',
              toast.variant === 'destructive' && 'text-destructive',
              toast.variant === 'success' && 'text-green-500',
              toast.variant === 'default' && 'text-primary',
            )} />
            <div className="flex-1 min-w-0">
              {toast.title && <p className="font-semibold text-sm">{toast.title}</p>}
              {toast.description && <p className="text-xs text-muted-foreground mt-0.5">{toast.description}</p>}
            </div>
            <button onClick={() => dismiss(toast.id)} className="shrink-0 text-muted-foreground hover:text-foreground transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

export const useToast = () => {
  const { toast } = useToastStore();
  return { toast };
};
