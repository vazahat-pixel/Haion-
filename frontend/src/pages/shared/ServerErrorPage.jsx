import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function ServerErrorPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <h1 className="text-2xl font-semibold">Server Error</h1>
      <Button asChild><Link to="/">Go Home</Link></Button>
    </div>
  );
}
