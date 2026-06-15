import { Link } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import { MESSAGES } from '@/constants/messages';
import { Button } from '@/components/ui/button';

export default function SessionExpiredPage() {
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <h1 className="text-2xl font-semibold">Session Expired</h1>
      <p className="text-[var(--color-text-secondary)]">{MESSAGES.SESSION_EXPIRED}</p>
      <Button asChild><Link to={ROUTES.AUTH_LOGIN}>Log back in</Link></Button>
    </div>
  );
}
