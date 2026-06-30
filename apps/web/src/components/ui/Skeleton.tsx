import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'card' | 'circle' | 'rect';
  width?: string | number;
  height?: string | number;
}

export default function Skeleton({ className, variant = 'text', width, height }: SkeletonProps) {
  const baseClasses = 'skeleton-shimmer rounded';

  const variantClasses = {
    text: 'h-4 w-full',
    card: 'h-48 w-full rounded-xl',
    circle: 'rounded-full',
    rect: 'rounded-lg',
  };

  return (
    <div
      className={cn(baseClasses, variantClasses[variant], className)}
      style={{ width, height }}
      aria-hidden="true"
    />
  );
}

// Hero Skeleton
export function HeroSkeleton() {
  return (
    <div className="text-center mb-12">
      <div className="flex flex-col items-center gap-4">
        <Skeleton variant="circle" width={48} height={48} />
        <Skeleton variant="text" className="h-10 w-64" />
        <Skeleton variant="text" className="h-6 w-96" />
        <Skeleton variant="text" className="h-5 w-[500px]" />
        <div className="flex gap-4 mt-4">
          <Skeleton variant="rect" width={160} height={44} />
          <Skeleton variant="rect" width={160} height={44} />
        </div>
      </div>
    </div>
  );
}

// Stats Skeleton
export function StatsSkeleton() {
  return (
    <div className="flex flex-wrap justify-center gap-6 mb-12">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex flex-col items-center gap-2">
          <Skeleton variant="text" className="h-8 w-16" />
          <Skeleton variant="text" className="h-4 w-20" />
        </div>
      ))}
    </div>
  );
}

// Games Grid Skeleton
export function GamesGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card">
          <Skeleton variant="card" className="mb-4" />
          <Skeleton variant="text" className="h-5 w-3/4 mb-2" />
          <Skeleton variant="text" className="h-4 w-full mb-1" />
          <Skeleton variant="text" className="h-4 w-1/2 mb-3" />
          <div className="flex justify-between pt-3 border-t border-border">
            <Skeleton variant="text" className="h-4 w-24" />
            <Skeleton variant="text" className="h-4 w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}

// List Skeleton (for organizers, teams, reviews)
export function ListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 card">
          <Skeleton variant="circle" width={48} height={48} />
          <div className="flex-1 space-y-2">
            <Skeleton variant="text" className="h-5 w-1/3" />
            <Skeleton variant="text" className="h-4 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

// FAQ Skeleton
export function FAQSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card">
          <div className="flex items-center justify-between">
            <Skeleton variant="text" className="h-5 w-2/3" />
            <Skeleton variant="rect" width={24} height={24} />
          </div>
        </div>
      ))}
    </div>
  );
}

// Section Header Skeleton
export function SectionHeaderSkeleton() {
  return (
    <div className="flex items-center justify-between mb-6">
      <Skeleton variant="text" className="h-7 w-48" />
      <Skeleton variant="text" className="h-5 w-24" />
    </div>
  );
}