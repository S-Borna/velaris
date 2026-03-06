// Copyright (c) Said Borna. All rights reserved.
import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
    /** Additional CSS classes for sizing/shaping the skeleton. */
    className?: string;
}

/**
 * Pulsing placeholder skeleton for loading states.
 * Use className to set h-*, w-*, rounded-* to match real content shape.
 */
export function Skeleton({ className, ...props }: SkeletonProps) {
    return (
        <div
            className={cn(
                "animate-pulse rounded-md bg-white/[0.06]",
                className,
            )}
            {...props}
        />
    );
}
