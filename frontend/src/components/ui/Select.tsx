import React, { useState, useRef, useEffect, useId, useCallback } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface SelectOption<T = any> {
  value: T;
  label: React.ReactNode;
  icon?: React.ReactNode;
  disabled?: boolean;
  description?: string;
}

export interface SelectProps<T = any> {
  value: T;
  onChange: (value: any) => void;
  options?: SelectOption<any>[];
  children?: React.ReactNode;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
  menuClassName?: string;
  icon?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  id?: string;
  name?: string;
  required?: boolean;
  error?: boolean | string;
  'aria-label'?: string;
}

export function Select<T = any>({
  value,
  onChange,
  options: optionsProp,
  children,
  placeholder = 'Pilih opsi...',
  disabled = false,
  className = '',
  triggerClassName = '',
  menuClassName = '',
  icon: leadingIcon,
  size = 'md',
  id,
  name,
  required,
  error,
  'aria-label': ariaLabel,
}: SelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [placement, setPlacement] = useState<'bottom' | 'top'>('bottom');
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const generatedId = useId();
  const selectId = id || generatedId;

  // Extract options from props or children (<option value="...">...</option>)
  const parsedOptions: SelectOption<any>[] = React.useMemo(() => {
    if (optionsProp && optionsProp.length > 0) {
      return optionsProp;
    }

    const extracted: SelectOption<any>[] = [];
    React.Children.forEach(children, (child) => {
      if (React.isValidElement(child) && child.type === 'option') {
        const childProps = child.props as any;
        extracted.push({
          value: childProps.value ?? '',
          label: childProps.children ?? childProps.label ?? String(childProps.value),
          disabled: Boolean(childProps.disabled),
        });
      }
    });

    return extracted;
  }, [optionsProp, children]);

  // Find currently selected option
  const selectedOption = parsedOptions.find(
    (opt) => String(opt.value) === String(value)
  );

  // Auto-detect optimal placement (top vs bottom) based on viewport space
  const updatePlacement = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;

    if (spaceBelow < 250 && spaceAbove > spaceBelow) {
      setPlacement('top');
    } else {
      setPlacement('bottom');
    }
  }, []);

  const handleToggle = () => {
    if (disabled) return;
    if (!isOpen) {
      updatePlacement();
      const currentIndex = parsedOptions.findIndex(
        (opt) => String(opt.value) === String(value)
      );
      setHighlightedIndex(currentIndex >= 0 ? currentIndex : 0);
    }
    setIsOpen((prev) => !prev);
  };

  const handleSelect = (option: SelectOption<T>) => {
    if (option.disabled) return;
    onChange(option.value);
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  // Click outside listener
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

    document.addEventListener('mousedown', handleClickOutside, true);
    document.addEventListener('touchstart', handleClickOutside, true);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside, true);
      document.removeEventListener('touchstart', handleClickOutside, true);
    };
  }, [isOpen]);

  // Recalculate placement on scroll/resize while open
  useEffect(() => {
    if (!isOpen) return;
    window.addEventListener('scroll', updatePlacement, true);
    window.addEventListener('resize', updatePlacement);
    return () => {
      window.removeEventListener('scroll', updatePlacement, true);
      window.removeEventListener('resize', updatePlacement);
    };
  }, [isOpen, updatePlacement]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (isOpen && highlightedIndex >= 0 && parsedOptions[highlightedIndex]) {
          handleSelect(parsedOptions[highlightedIndex]);
        } else {
          handleToggle();
        }
        break;
      case 'Escape':
        if (isOpen) {
          e.preventDefault();
          setIsOpen(false);
          triggerRef.current?.focus();
        }
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (!isOpen) {
          handleToggle();
        } else {
          setHighlightedIndex((prev) => {
            const next = prev + 1;
            return next < parsedOptions.length ? next : 0;
          });
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (!isOpen) {
          handleToggle();
        } else {
          setHighlightedIndex((prev) => {
            const next = prev - 1;
            return next >= 0 ? next : parsedOptions.length - 1;
          });
        }
        break;
      case 'Tab':
        if (isOpen) {
          setIsOpen(false);
        }
        break;
      default:
        break;
    }
  };

  // Scroll highlighted item into view
  useEffect(() => {
    if (isOpen && highlightedIndex >= 0 && menuRef.current) {
      const items = menuRef.current.querySelectorAll('[data-select-item]');
      const activeEl = items[highlightedIndex] as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex, isOpen]);

  // Size styling maps
  const sizeClasses = {
    sm: 'h-8 py-1.5 px-3 text-xs gap-1.5',
    md: 'h-9 py-2 px-3 text-xs gap-2',
    lg: 'h-10 py-2.5 px-3.5 text-sm gap-2.5',
  };

  return (
    <div
      ref={containerRef}
      className={`relative inline-block w-full text-left ${className}`}
      onKeyDown={handleKeyDown}
    >
      {/* Hidden input for form submission compatibility */}
      {name && (
        <input
          type="hidden"
          name={name}
          value={String(value)}
          required={required}
        />
      )}

      {/* Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        id={selectId}
        disabled={disabled}
        onClick={handleToggle}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={ariaLabel}
        className={`w-full flex items-center justify-between rounded-xl border font-normal transition-all duration-180 cursor-pointer select-none
          bg-[var(--color-surface)]/85 backdrop-blur-md
          border-[var(--color-border)]
          hover:border-[var(--color-primary)]/40
          text-[var(--color-text-primary)]
          shadow-xs
          focus:outline-hidden focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)]
          disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-[var(--color-border-muted)]
          ${error ? '!border-[var(--color-danger)] !ring-1 !ring-[var(--color-danger)]/30' : ''}
          ${isOpen ? 'ring-2 ring-[var(--color-primary)]/20 border-[var(--color-primary)] shadow-md' : ''}
          ${sizeClasses[size]}
          ${triggerClassName}`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {leadingIcon && (
            <span className="shrink-0 text-[var(--color-text-muted)] flex items-center">
              {leadingIcon}
            </span>
          )}
          {selectedOption?.icon && (
            <span className="shrink-0 flex items-center">
              {selectedOption.icon}
            </span>
          )}
          <span
            className={`truncate block ${
              !selectedOption ? 'text-[var(--color-text-muted)]' : ''
            }`}
          >
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>

        <ChevronDown
          className={`w-4 h-4 shrink-0 text-[var(--color-text-muted)] transition-transform duration-200 ease-out ${
            isOpen ? 'rotate-180 text-[var(--color-primary)]' : ''
          }`}
        />
      </button>

      {/* Floating Glass Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={menuRef}
            role="listbox"
            tabIndex={-1}
            initial={{
              opacity: 0,
              scale: 0.96,
              y: placement === 'bottom' ? -4 : 4,
            }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
              scale: 0.96,
              y: placement === 'bottom' ? -4 : 4,
            }}
            transition={{
              duration: 0.18,
              ease: [0.16, 1, 0.3, 1], // Fluid spring cubic-bezier
            }}
            style={{
              transformOrigin:
                placement === 'bottom' ? 'top center' : 'bottom center',
            }}
            className={`absolute z-50 left-0 right-0 min-w-[180px] w-full max-h-64 overflow-y-auto rounded-xl p-1.5
              bg-[var(--color-surface-raised)]/95 backdrop-blur-xl
              border border-[var(--color-border)]
              shadow-2xl shadow-black/10 dark:shadow-black/70
              scrollbar-thin
              ${placement === 'bottom' ? 'top-full mt-1.5' : 'bottom-full mb-1.5'}
              ${menuClassName}`}
          >
            {parsedOptions.length === 0 ? (
              <div className="py-2.5 px-3 text-center text-xs text-[var(--color-text-muted)]">
                Tidak ada opsi tersedia
              </div>
            ) : (
              parsedOptions.map((option, index) => {
                const isSelected = String(option.value) === String(value);
                const isHighlighted = highlightedIndex === index;

                return (
                  <div
                    key={`${String(option.value)}-${index}`}
                    data-select-item
                    role="option"
                    aria-selected={isSelected}
                    aria-disabled={option.disabled}
                    onClick={() => handleSelect(option)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={`group relative flex items-center justify-between px-3 py-2 text-xs rounded-lg transition-colors duration-150 select-none
                      ${
                        option.disabled
                          ? 'opacity-40 cursor-not-allowed'
                          : 'cursor-pointer'
                      }
                      ${
                        isSelected
                          ? 'bg-[#EBF3EE] text-[#1E4D38] dark:bg-[#1E3A2B]/80 dark:text-[#A7F3D0] font-semibold'
                          : isHighlighted
                          ? 'bg-[var(--color-border-muted)] text-[var(--color-text-primary)]'
                          : 'text-[var(--color-text-primary)] hover:bg-[var(--color-border-muted)]'
                      }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {option.icon && (
                        <span className="shrink-0 flex items-center">
                          {option.icon}
                        </span>
                      )}
                      <div className="min-w-0 flex-1">
                        <span className="block truncate">{option.label}</span>
                        {option.description && (
                          <span className="block text-[10px] text-[var(--color-text-muted)] truncate">
                            {option.description}
                          </span>
                        )}
                      </div>
                    </div>

                    {isSelected && (
                      <Check className="w-4 h-4 shrink-0 text-[#2A6A4E] dark:text-[#6EE7B7] ml-2" />
                    )}
                  </div>
                );
              })
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
