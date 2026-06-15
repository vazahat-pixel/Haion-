import { BrowserRouter } from 'react-router-dom';
import { MotionConfig } from 'framer-motion';
import { QueryProvider } from '@/providers/QueryProvider';
import { AuthProvider } from '@/providers/AuthProvider';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { Toaster } from '@/components/ui/sonner';

export function Providers({ children }) {
  return (
    <QueryProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AuthProvider>
          <ThemeProvider>
            <MotionConfig reducedMotion="user">
              {children}
              <Toaster />
            </MotionConfig>
          </ThemeProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryProvider>
  );
}
