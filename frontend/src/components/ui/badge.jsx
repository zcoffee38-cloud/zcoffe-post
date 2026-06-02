import { cn } from '../../lib/utils';

const variants = {
  default: 'bg-primary/10 text-primary border-primary/20',
  secondary: 'bg-secondary text-secondary-foreground border-transparent',
  destructive: 'bg-destructive/10 text-destructive border-destructive/20',
  success: 'bg-green-500/10 text-green-600 border-green-500/20 dark:text-green-400',
  warning: 'bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400',
  outline: 'border-border text-foreground',
};

function Badge({ className, variant = 'default', ...props }) {
  return (
    <div className={cn(
      'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
      variants[variant],
      className
    )} {...props} />
  );
}

export { Badge };
