import { Providers } from './Providers';
import { Router } from './Router';
import { AppErrorBoundary } from '@/components/error-boundaries/AppErrorBoundary';

export default function App() {
  return (
    <AppErrorBoundary>
      <Providers>
        <Router />
      </Providers>
    </AppErrorBoundary>
  );
}
