import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { customerStagger } from '@/animations/customer.motion';

function ShimmerBlock({ className }) {
  return (
    <div className={className}>
      <Skeleton className="h-full w-full rounded-2xl" />
    </div>
  );
}

export function CustomerHomeLoader() {
  return (
    <motion.div
      variants={customerStagger.container}
      initial="hidden"
      animate="show"
      className="space-y-4"
      role="status"
      aria-label="Loading dashboard"
    >
      <motion.div variants={customerStagger.item} className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-3 w-24 rounded-full" />
          <Skeleton className="h-7 w-48 rounded-lg" />
        </div>
        <div className="customer-loader-orb h-10 w-10 rounded-full" />
      </motion.div>

      <motion.div variants={customerStagger.item} className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <ShimmerBlock key={i} className="h-[72px]" />
        ))}
      </motion.div>

      <motion.div variants={customerStagger.item} className="flex gap-2 overflow-hidden">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-20 shrink-0 rounded-2xl" />
        ))}
      </motion.div>

      <motion.div variants={customerStagger.item} className="grid gap-3 lg:grid-cols-12">
        <div className="space-y-2 lg:col-span-8">
          {[0, 1, 2].map((i) => (
            <ShimmerBlock key={i} className="h-[68px]" />
          ))}
        </div>
        <div className="space-y-2 lg:col-span-4">
          {[0, 1].map((i) => (
            <ShimmerBlock key={i} className="h-[88px]" />
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
