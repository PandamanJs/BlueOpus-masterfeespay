interface SkeletonProps {
  variant?: 'text' | 'heading' | 'avatar' | 'button' | 'card' | 'custom';
  width?: string;
  height?: string;
  className?: string;
  count?: number;
}

export default function Skeleton({ 
  variant = 'text', 
  width, 
  height,
  className = '',
  count = 1
}: SkeletonProps) {
  const getVariantClass = () => {
    switch (variant) {
      case 'text':
        return 'skeleton-text';
      case 'heading':
        return 'skeleton-heading';
      case 'avatar':
        return 'skeleton-avatar';
      case 'button':
        return 'skeleton-button';
      case 'card':
        return 'skeleton-card';
      default:
        return '';
    }
  };

  const style: React.CSSProperties = {};
  if (width) style.width = width;
  if (height) style.height = height;

  const skeletons = Array.from({ length: count }, (_, i) => (
    <div 
      key={i}
      className={`skeleton ${getVariantClass()} ${className}`}
      style={style}
      aria-hidden="true"
    />
  ));

  return <>{skeletons}</>;
}

// Preset skeleton layouts for common use cases
export function SkeletonCard() {
  return (
    <div className="bg-white rounded-[16px] p-6 space-y-4">
      <div className="flex items-center gap-4">
        <Skeleton variant="avatar" width="48px" height="48px" />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" width="60%" />
          <Skeleton variant="text" width="40%" />
        </div>
      </div>
      <Skeleton variant="text" count={3} />
    </div>
  );
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="bg-white rounded-[12px] p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 space-y-2">
              <Skeleton variant="text" width="70%" />
              <Skeleton variant="text" width="40%" />
            </div>
            <Skeleton variant="text" width="60px" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonReceipt() {
  return (
    <div className="bg-white rounded-[16px] p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton variant="heading" width="40%" />
        <Skeleton variant="text" width="80px" />
      </div>
      
      {/* Divider */}
      <div className="separator-light" />
      
      {/* Items */}
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex justify-between">
            <Skeleton variant="text" width="50%" />
            <Skeleton variant="text" width="80px" />
          </div>
        ))}
      </div>
      
      {/* Divider */}
      <div className="separator-light" />
      
      {/* Total */}
      <div className="flex justify-between items-center">
        <Skeleton variant="heading" width="30%" />
        <Skeleton variant="heading" width="100px" />
      </div>
      
      {/* Button */}
      <Skeleton variant="button" />
    </div>
  );
}
