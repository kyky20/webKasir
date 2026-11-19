import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export interface DropdownMenuItem {
  label: React.ReactNode;
  icon?: React.ReactNode;
  onClick?: () => void;
  danger?: boolean;
  disabled?: boolean;
  separator?: boolean;
  description?: string;
  badge?: React.ReactNode;
}

export interface DropdownMenuProps {
  trigger: React.ReactNode;
  items?: DropdownMenuItem[];
  children?: React.ReactNode;
  align?: 'left' | 'right';
  className?: string;
  menuClassName?: string;
}

export const DropdownMenu: React.FC<DropdownMenuProps> = ({
  trigger,
  items,
  children,
  align = 'right',
  className = '',
  menuClassName = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [placement, setPlacement] = useState<'bottom' | 'top'>('bottom');
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  const updatePlacement = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;

    if (spaceBelow < 280 && spaceAbove > spaceBelow) {
      setPlacement('top');
    } else {
      setPlacement('bottom');
    }
  }, []);

  const handleToggle = () => {
    if (!isOpen) {
      updatePlacement();
    }
    setIsOpen((prev) => !prev);
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside, true);
    document.addEventListener('touchstart', handleClickOutside, true);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside, true);
      document.removeEventListener('touchstart', handleClickOutside, true);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className={`relative inline-block text-left ${className}`}>
      <div ref={triggerRef} onClick={handleToggle} className="cursor-pointer">
        {trigger}
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{
              opacity: 0,
              scale: 0.95,
              y: placement === 'bottom' ? -4 : 4,
            }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{
              opacity: 0,
              scale: 0.95,
              y: placement === 'bottom' ? -4 : 4,
            }}
            transition={{
              duration: 0.18,
              ease: [0.16, 1, 0.3, 1],
            }}
            style={{
              transformOrigin:
                placement === 'bottom'
                  ? align === 'right'
                    ? 'top right'
                    : 'top left'
                  : align === 'right'
                  ? 'bottom right'
                  : 'bottom left',
            }}
            className={`absolute z-50 min-w-[200px] rounded-xl p-1.5
              bg-[var(--color-surface-raised)]/95 backdrop-blur-xl
              border border-[var(--color-border)]
              shadow-2xl shadow-black/10 dark:shadow-black/70
              ${align === 'right' ? 'right-0' : 'left-0'}
              ${placement === 'bottom' ? 'top-full mt-1.5' : 'bottom-full mb-1.5'}
              ${menuClassName}`}
          >
            {items
              ? items.map((item, idx) => {
                  if (item.separator) {
                    return (
                      <div
                        key={`sep-${idx}`}
                        className="my-1 border-t border-[var(--color-border)]"
                      />
                    );
                  }

                  return (
                    <button
                      key={`item-${idx}`}
                      type="button"
                      disabled={item.disabled}
                      onClick={() => {
                        if (item.disabled) return;
                        item.onClick?.();
                        setIsOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg transition-colors duration-150 text-left select-none cursor-pointer
                        ${
                          item.disabled
                            ? 'opacity-40 cursor-not-allowed'
                            : item.danger
                            ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40'
                            : 'text-[var(--color-text-primary)] hover:bg-[var(--color-border-muted)]'
                        }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {item.icon && (
                          <span className="shrink-0 text-[var(--color-text-muted)]">
                            {item.icon}
                          </span>
                        )}
                        <div className="min-w-0">
                          <span className="block truncate font-medium">
                            {item.label}
                          </span>
                          {item.description && (
                            <span className="block text-[10px] text-[var(--color-text-muted)] truncate">
                              {item.description}
                            </span>
                          )}
                        </div>
                      </div>
                      {item.badge && <span className="ml-2 shrink-0">{item.badge}</span>}
                    </button>
                  );
                })
              : children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
