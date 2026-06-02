import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogClose = DialogPrimitive.Close;

const DialogPortal = ({ children, ...props }) => (
  <DialogPrimitive.Portal {...props}>
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {children}
    </div>
  </DialogPrimitive.Portal>
);

const DialogOverlay = ({ className, ...props }) => (
  <DialogPrimitive.Overlay
    className={cn(
      'fixed inset-0 z-50 bg-black/60 backdrop-blur-sm',
      'data-[state=open]:animate-in data-[state=closed]:animate-out',
      'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
      className
    )}
    {...props}
  />
);

const DialogContent = ({ className, children, ...props }) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      className={cn(
        'relative z-50 grid w-full max-w-lg gap-4 rounded-2xl border bg-card p-6 shadow-xl',
        'data-[state=open]:animate-in data-[state=closed]:animate-out',
        'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
        'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
        'max-h-[90vh] overflow-y-auto',
        className
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-4 top-4 rounded-lg p-1 text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring">
        <X className="h-4 w-4" />
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
);

const DialogHeader = ({ className, ...props }) => (
  <div className={cn('flex flex-col space-y-1.5', className)} {...props} />
);

const DialogTitle = ({ className, ...props }) => (
  <DialogPrimitive.Title className={cn('text-lg font-semibold leading-none tracking-tight', className)} {...props} />
);

const DialogDescription = ({ className, ...props }) => (
  <DialogPrimitive.Description className={cn('text-sm text-muted-foreground', className)} {...props} />
);

export { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose };
