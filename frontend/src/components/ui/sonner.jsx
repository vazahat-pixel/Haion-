import { Toaster as Sonner } from 'sonner';

function Toaster({ ...props }) {
  return (
    <Sonner
      theme="system"
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast: 'border border-surface-3 bg-surface-0 shadow-lg',
        },
      }}
      {...props}
    />
  );
}

export { Toaster };
