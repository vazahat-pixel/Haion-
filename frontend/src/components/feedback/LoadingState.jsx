import { Loader2 } from 'lucide-react';
import { cn } from '@/utils/cn';

export function LoadingState({ message = 'Loading...', fullPage = false, size = 'default' }) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3',
        fullPage ? 'min-h-screen' : 'min-h-[200px]',
        size === 'sm' && 'min-h-[100px]'
      )}
    >
      <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
      {message && <p className="text-sm text-[var(--color-text-secondary)]">{message}</p>}
    </div>
  );
}
