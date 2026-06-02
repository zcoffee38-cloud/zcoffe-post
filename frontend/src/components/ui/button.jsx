import { cn } from '../../lib/utils';
import { forwardRef } from 'react';

const variants = {
  default: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm',
  destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
  outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
  secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
  ghost: 'hover:bg-accent hover:text-accent-foreground',
  link: 'text-primary underline-offset-4 hover:underline',
  coffee: 'bg-coffee-700 text-cream-50 hover:bg-coffee-800 shadow-sm',
};

const sizes = {
  default: 'h-10 px-4 py-2 text-sm',
  sm: 'h-8 px-3 text-xs',
  lg: 'h-12 px-6 text-base',
  xl: 'h-14 px-8 text-lg',
  icon: 'h-10 w-10',
};

const Button = forwardRef(({ className, variant = 'default', size = 'default', children, ...props }, ref) => (
  <button
    ref={ref}
    className={cn(
      'inline-flex items-center justify-center gap-2 rounded-xl font-semibold ring-offset-background',
      'transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
      'disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]',
      variants[variant],
      sizes[size],
      className
    )}
    {...props}
  >
    {children}
  </button>
));

Button.displayName = 'Button';
export { Button };
