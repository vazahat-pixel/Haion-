import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { MESSAGES } from '@/constants/messages';
import { WifiOff } from 'lucide-react';

export function OfflineBanner() {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed left-0 right-0 top-0 z-max flex items-center justify-center gap-2 bg-[var(--color-warning)] px-4 py-2 text-sm font-medium text-white">
      <WifiOff className="h-4 w-4" />
      {MESSAGES.OFFLINE_BANNER}
    </div>
  );
}
