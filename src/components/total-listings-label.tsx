import React from 'react';
import { cn } from '@/lib/utils';
import { Skeleton } from "@/components/ui/skeleton"; // Import Skeleton for loading state

interface TotalListingsLabelProps {
  total: number | null; // Allow null for initial loading state
  loading?: boolean;
  className?: string;
}

export function TotalListingsLabel({ total, loading, className }: TotalListingsLabelProps) {
  if (loading || total === null) {
    return <Skeleton className={cn("h-6 w-24 rounded-full", className)} />; // Show skeleton while loading
  }

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary shadow-sm border border-primary/20',
        className
      )}
    >
      Total Listings: {total}
    </div>
  );
}
