import LandingApp from '@/features/landing/App';
import { CMSProvider } from '@/features/landing/cms/CMSContext';

export default function LandingPage() {
  return (
    <CMSProvider page="home">
      <LandingApp />
    </CMSProvider>
  );
}