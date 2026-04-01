import { useState, useRef, useEffect } from "react";
import { motion, useMotionValue, useTransform, type PanInfo } from "motion/react";
import { Trash2, Archive, MoreHorizontal } from "lucide-react";

interface SwipeAction {
  label: string;
  icon?: React.ReactNode;
  color: string;
  onAction: () => void;
}

interface SwipeableListItemProps {
  children: React.ReactNode;
  onDelete?: () => void;
  onArchive?: () => void;
  customActions?: SwipeAction[];
}

export default function SwipeableListItem({
  children,
  onDelete,
  onArchive,
  customActions
}: SwipeableListItemProps) {
  const [isRevealed, setIsRevealed] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);

  // Default actions
  const actions: SwipeAction[] = customActions || [
    ...(onArchive ? [{
      label: "Archive",
      icon: <Archive size={20} />,
      color: "#ff9500",
      onAction: onArchive
    }] : []),
    ...(onDelete ? [{
      label: "Delete",
      icon: <Trash2 size={20} />,
      color: "#ff3b30",
      onAction: onDelete
    }] : [])
  ];

  const actionWidth = 80;
  const totalActionWidth = actions.length * actionWidth;

  const handleDragEnd = (_: any, info: PanInfo) => {
    const threshold = -60;

    if (info.offset.x < threshold) {
      setIsRevealed(true);
      x.set(-totalActionWidth);
    } else {
      setIsRevealed(false);
      x.set(0);
    }
  };

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isRevealed && containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsRevealed(false);
        x.set(0);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isRevealed, x]);

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden"
      style={{ touchAction: 'pan-y' }}
    >
      {/* Action buttons */}
      <div className="absolute right-0 top-0 bottom-0 flex">
        {actions.map((action, index) => (
          <button
            key={index}
            onClick={() => {
              action.onAction();
              setIsRevealed(false);
              x.set(0);
            }}
            className="flex items-center justify-center text-white font-semibold transition-all active:brightness-90"
            style={{
              width: `${actionWidth}px`,
              backgroundColor: action.color
            }}
          >
            <div className="flex flex-col items-center gap-1">
              {action.icon}
              <span className="text-xs">{action.label}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Swipeable content */}
      <motion.div
        drag="x"
        dragConstraints={{ left: -totalActionWidth, right: 0 }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        style={{ x }}
        className="relative bg-white"
      >
        {children}
      </motion.div>
    </div>
  );
}
