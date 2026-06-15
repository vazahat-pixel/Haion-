import { PageHeader } from './PageHeader';
import { MotionPage } from '@/components/motion/MotionPage';
import { cn } from '@/utils/cn';

/** Mobile-first page shell for customer portal (375px optimized) */
export function CustomerPageShell({ title, subtitle, actions, children, className }) {
  return (
    <MotionPage>
      <div className={cn('mx-auto w-full max-w-lg space-y-5 p-4 sm:max-w-2xl sm:p-6 lg:max-w-4xl', className)}>
        <PageHeader title={title} subtitle={subtitle} actions={actions} />
        {children}
      </div>
    </MotionPage>
  );
}
