import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-cefide-accent text-black',
        success: 'bg-cefide-success/20 text-cefide-success',
        warning: 'bg-cefide-warning/20 text-cefide-warning',
        destructive: 'bg-cefide-accent-alt/20 text-cefide-accent-alt',
        muted: 'bg-cefide-border text-cefide-muted',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
