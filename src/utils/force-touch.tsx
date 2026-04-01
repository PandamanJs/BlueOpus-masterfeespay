/**
 * 3D Touch / Force Touch Utility
 * Enables pressure-sensitive interactions on supported devices
 * Falls back gracefully on devices without force touch support
 */

import { useEffect, useRef, useState, cloneElement, ReactElement, ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';

type ForceTouchCallback = (force: number, maxForce: number) => void;
type ForceTouchEndCallback = () => void;

interface ForceTouchOptions {
  threshold?: number; // Force threshold (0-1) to trigger "deep press"
  onForceChange?: ForceTouchCallback;
  onDeepPress?: () => void;
  onForceEnd?: ForceTouchEndCallback;
  enableHaptics?: boolean;
}

/**
 * Check if device supports force touch
 */
export function supportsForceTouchAPI(): boolean {
  return 'ontouchstart' in window && 'force' in TouchEvent.prototype;
}

/**
 * Attach force touch listeners to an element
 */
export function attachForceTouch(
  element: HTMLElement,
  options: ForceTouchOptions = {}
): () => void {
  const {
    threshold = 0.75, // 75% force triggers deep press
    onForceChange,
    onDeepPress,
    onForceEnd,
    enableHaptics = true
  } = options;

  let hasTriggeredDeepPress = false;
  let hapticTriggered = false;

  const handleTouchStart = (e: TouchEvent) => {
    hasTriggeredDeepPress = false;
    hapticTriggered = false;
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!supportsForceTouchAPI()) return;

    const touch = e.touches[0];
    if (!touch) return;

    // @ts-ignore - force is not in TypeScript definitions yet
    const force = touch.force || 0;
    // @ts-ignore
    const maxForce = touch.forceMax || 1;
    
    const normalizedForce = force / maxForce;

    // Call force change callback
    onForceChange?.(force, maxForce);

    // Visual feedback - scale element based on force
    const scale = 1 - (normalizedForce * 0.05); // Subtle scale down
    element.style.transform = `scale(${scale})`;

    // Trigger deep press at threshold
    if (normalizedForce >= threshold && !hasTriggeredDeepPress) {
      hasTriggeredDeepPress = true;
      onDeepPress?.();
      
      // Haptic feedback
      if (enableHaptics && 'vibrate' in navigator && !hapticTriggered) {
        navigator.vibrate([10, 50, 10]); // Double tap pattern
        hapticTriggered = true;
      }

      // Visual pop
      element.style.transition = 'transform 0.1s cubic-bezier(0.34, 1.56, 0.64, 1)';
      element.style.transform = 'scale(0.90)';
      setTimeout(() => {
        element.style.transform = 'scale(1)';
      }, 100);
    }
  };

  const handleTouchEnd = () => {
    // Reset transform
    element.style.transition = 'transform 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    element.style.transform = 'scale(1)';
    onForceEnd?.();
  };

  // Attach listeners
  element.addEventListener('touchstart', handleTouchStart, { passive: true });
  element.addEventListener('touchmove', handleTouchMove, { passive: true });
  element.addEventListener('touchend', handleTouchEnd);
  element.addEventListener('touchcancel', handleTouchEnd);

  // Return cleanup function
  return () => {
    element.removeEventListener('touchstart', handleTouchStart);
    element.removeEventListener('touchmove', handleTouchMove);
    element.removeEventListener('touchend', handleTouchEnd);
    element.removeEventListener('touchcancel', handleTouchEnd);
    element.style.transform = '';
    element.style.transition = '';
  };
}

/**
 * React hook for force touch
 */
export function useForceTouch(options: ForceTouchOptions = {}) {
  const elementRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    return attachForceTouch(element, options);
  }, [options]);

  return elementRef;
}

/**
 * Higher-order component for adding force touch to any component
 */
interface ForceTouchWrapperProps {
  children: ReactElement;
  onDeepPress?: () => void;
  threshold?: number;
  showIndicator?: boolean;
}

export function ForceTouchWrapper({ 
  children, 
  onDeepPress, 
  threshold = 0.75,
  showIndicator = true 
}: ForceTouchWrapperProps) {
  const elementRef = useForceTouch({ onDeepPress, threshold });

  // Add visual indicator if supported
  const supportsForce = supportsForceTouchAPI();

  return (
    <div ref={elementRef as any} className="relative inline-block">
      {children}
      {showIndicator && supportsForce && (
        <div className="absolute -top-1 -right-1 w-2 h-2 bg-[#95e36c] rounded-full animate-pulse" 
             title="3D Touch enabled" />
      )}
    </div>
  );
}

/**
 * Context menu-style force touch
 * Shows a menu when force threshold is reached
 */
interface ForceTouchMenuProps {
  children: ReactElement;
  menuItems: Array<{
    label: string;
    icon?: ReactNode;
    onClick: () => void;
    destructive?: boolean;
  }>;
  threshold?: number;
}

export function ForceTouchMenu({ 
  children, 
  menuItems, 
  threshold = 0.75 
}: ForceTouchMenuProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });

  const handleDeepPress = () => {
    setShowMenu(true);
  };

  const handleMenuItemClick = (onClick: () => void) => {
    onClick();
    setShowMenu(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setMenuPosition({ x: touch.clientX, y: touch.clientY });
  };

  return (
    <>
      <ForceTouchWrapper 
        onDeepPress={handleDeepPress} 
        threshold={threshold}
        showIndicator={true}
      >
        <div onTouchStart={handleTouchStart}>
          {children}
        </div>
      </ForceTouchWrapper>

      <AnimatePresence>
        {showMenu && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-[1000]"
              onClick={() => setShowMenu(false)}
            />

            {/* Menu */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: menuPosition.y, x: menuPosition.x }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="fixed z-[1001] bg-white/95 backdrop-blur-xl rounded-[16px] shadow-2xl overflow-hidden"
              style={{
                top: menuPosition.y - 100,
                left: Math.max(16, Math.min(menuPosition.x - 80, window.innerWidth - 176)),
                minWidth: '160px'
              }}
            >
              {menuItems.map((item, index) => (
                <button
                  key={index}
                  onClick={() => handleMenuItemClick(item.onClick)}
                  className={`
                    w-full px-6 py-4 flex items-center gap-3 
                    transition-colors active:bg-black/5
                    ${item.destructive ? 'text-red-500' : 'text-[#003630]'}
                    ${index !== menuItems.length - 1 ? 'border-b border-black/5' : ''}
                  `}
                >
                  {item.icon && <span className="text-lg">{item.icon}</span>}
                  <span className="font-medium text-[15px]">{item.label}</span>
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

/**
 * Peek & Pop component (iOS-style preview)
 * Light press shows preview, deep press commits action
 */
interface PeekPopProps {
  children: ReactElement;
  previewContent: ReactNode;
  onPop?: () => void;
  peekThreshold?: number;
  popThreshold?: number;
}

export function PeekPop({ 
  children, 
  previewContent, 
  onPop,
  peekThreshold = 0.5,
  popThreshold = 0.9
}: PeekPopProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [forceLevel, setForceLevel] = useState(0);

  const handleForceChange = (force: number, maxForce: number) => {
    const normalized = force / maxForce;
    setForceLevel(normalized);

    if (normalized >= peekThreshold && !showPreview) {
      setShowPreview(true);
      if ('vibrate' in navigator) {
        navigator.vibrate(10);
      }
    } else if (normalized < peekThreshold && showPreview) {
      setShowPreview(false);
    }

    if (normalized >= popThreshold) {
      onPop?.();
      setShowPreview(false);
      if ('vibrate' in navigator) {
        navigator.vibrate([15, 30, 15]);
      }
    }
  };

  const handleForceEnd = () => {
    setShowPreview(false);
    setForceLevel(0);
  };

  const elementRef = useForceTouch({
    onForceChange: handleForceChange,
    onForceEnd: handleForceEnd
  });

  return (
    <>
      <div ref={elementRef as any}>
        {children}
      </div>

      <AnimatePresence>
        {showPreview && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed inset-0 flex items-center justify-center z-[999] pointer-events-none"
          >
            <div className="bg-white/95 backdrop-blur-xl rounded-[20px] shadow-2xl p-6 max-w-[90vw] max-h-[80vh] overflow-auto">
              {previewContent}
              <div className="mt-4 text-center text-sm text-gray-500">
                Press deeper to open
              </div>
              <div className="mt-2 w-full bg-gray-200 rounded-full h-1 overflow-hidden">
                <motion.div 
                  className="bg-[#95e36c] h-full"
                  initial={{ width: '0%' }}
                  animate={{ width: `${(forceLevel / popThreshold) * 100}%` }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
