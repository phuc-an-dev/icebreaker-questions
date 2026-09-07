'use client';

import React, { useState, useRef, useEffect, useId, useCallback, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Search, Check } from 'lucide-react';
import { IconHelper } from '@/components/ui/IconHelper';
import { hapticFeedback } from '@/lib/haptics';

export interface DropdownOption {
  id: string;
  label: string;
  sublabel?: string;
  color?: string;
  iconName?: string;
}

interface SearchableDropdownProps {
  label: string;
  icon?: React.ReactNode;
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
}

interface DropdownPosition {
  top: number;
  left: number;
  width: number;
  openUpward: boolean;
}

const emptySubscribe = () => () => {};

export const SearchableDropdown: React.FC<SearchableDropdownProps> = ({
  label,
  icon,
  options,
  value,
  onChange,
  placeholder = 'Select an option...',
  searchPlaceholder = 'Search...',
  disabled = false,
}) => {
  const dropdownId = useId();
  const listboxId = `${dropdownId}-listbox`;
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [position, setPosition] = useState<DropdownPosition>({
    top: 0,
    left: 0,
    width: 0,
    openUpward: false,
  });

  // Client-only flag — no useEffect setState
  const isClient = useSyncExternalStore(emptySubscribe, () => true, () => false);

  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Find currently selected option
  const selectedOption = options.find((opt) => opt.id === value);

  // Filter options based on search query
  const filteredOptions = options.filter((opt) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      opt.label.toLowerCase().includes(q) ||
      opt.id.toLowerCase().includes(q) ||
      (opt.sublabel && opt.sublabel.toLowerCase().includes(q))
    );
  });

  // Calculate fixed portal positioning relative to trigger
  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const dropdownHeight = 280; // Approximate max popover height
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const openUpward = spaceBelow < dropdownHeight && spaceAbove > spaceBelow;

    setPosition({
      top: openUpward ? rect.top : rect.bottom + 6,
      left: rect.left,
      width: rect.width,
      openUpward,
    });
  }, []);

  const openDropdown = () => {
    if (disabled) return;
    hapticFeedback.light();
    updatePosition();
    setSearch('');
    // Highlight currently selected option index
    const curIndex = options.findIndex((opt) => opt.id === value);
    setHighlightedIndex(curIndex >= 0 ? curIndex : 0);
    setIsOpen(true);
  };

  const closeDropdown = useCallback((returnFocusToTrigger = true) => {
    setIsOpen(false);
    setSearch('');
    if (returnFocusToTrigger) {
      triggerRef.current?.focus();
    }
  }, []);

  // Handle option selection
  const handleSelectOption = (opt: DropdownOption) => {
    hapticFeedback.light();
    onChange(opt.id);
    closeDropdown(true);
  };

  // Focus search input on open & re-scroll highlighted item
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
        // Scroll highlighted item into view
        if (optionRefs.current[highlightedIndex]) {
          optionRefs.current[highlightedIndex]?.scrollIntoView({ block: 'nearest' });
        }
      }, 30);
      return () => clearTimeout(timer);
    }
  }, [isOpen, highlightedIndex]);

  // Recalculate position on scroll or resize
  useEffect(() => {
    if (!isOpen) return;
    const handleScrollOrResize = () => updatePosition();
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);
    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [isOpen, updatePosition]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        popoverRef.current &&
        !popoverRef.current.contains(target)
      ) {
        closeDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen, closeDropdown]);

  // Keyboard navigation inside search input
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIdx = filteredOptions.length > 0 ? (highlightedIndex + 1) % filteredOptions.length : 0;
      setHighlightedIndex(nextIdx);
      optionRefs.current[nextIdx]?.focus();
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIdx = filteredOptions.length > 0 ? (highlightedIndex - 1 + filteredOptions.length) % filteredOptions.length : 0;
      setHighlightedIndex(prevIdx);
      optionRefs.current[prevIdx]?.focus();
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredOptions[highlightedIndex]) {
        handleSelectOption(filteredOptions[highlightedIndex]);
      }
      return;
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      closeDropdown(true);
      return;
    }
    if (e.key === 'Tab') {
      if (e.shiftKey) {
        // Shift+Tab → close & focus back to trigger
        e.preventDefault();
        closeDropdown(true);
      }
      // Natural Tab moves into first option button
    }
  };

  // Keyboard navigation on trigger
  const handleTriggerKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openDropdown();
    }
  };

  // Keyboard navigation inside option button
  const handleOptionKeyDown = (
    e: React.KeyboardEvent<HTMLButtonElement>,
    idx: number,
    opt: DropdownOption
  ) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      closeDropdown(true);
      return;
    }
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleSelectOption(opt);
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = (idx + 1) % filteredOptions.length;
      setHighlightedIndex(next);
      optionRefs.current[next]?.focus();
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prev = (idx - 1 + filteredOptions.length) % filteredOptions.length;
      setHighlightedIndex(prev);
      optionRefs.current[prev]?.focus();
      return;
    }
    if (e.key === 'Tab') {
      if (e.shiftKey) {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else {
        closeDropdown(false);
      }
    }
  };

  const portalStyle: React.CSSProperties = {
    position: 'fixed',
    left: position.left,
    width: position.width,
    zIndex: 9999,
    ...(position.openUpward
      ? { bottom: window.innerHeight - position.top }
      : { top: position.top }),
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Label */}
      {label && (
        <label
          id={`${dropdownId}-label`}
          className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-content-muted mb-2"
        >
          {icon}
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-labelledby={label ? `${dropdownId}-label` : undefined}
        disabled={disabled}
        onClick={() => (isOpen ? closeDropdown(false) : openDropdown())}
        onKeyDown={handleTriggerKeyDown}
        className={`w-full flex items-center justify-between px-3.5 py-2.5 bg-surface-input border rounded-xl text-left text-sm transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
          isOpen
            ? 'border-blue-500 ring-2 ring-blue-500/30'
            : 'border-edge-strong hover:border-edge-strong/80'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <div className="flex items-center gap-2.5 overflow-hidden">
          {selectedOption ? (
            <>
              {selectedOption.iconName && (
                <div
                  className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 border"
                  style={{
                    backgroundColor: selectedOption.color ? `${selectedOption.color}20` : 'rgba(59,130,246,0.15)',
                    borderColor: selectedOption.color ? `${selectedOption.color}50` : 'rgba(59,130,246,0.3)',
                    color: selectedOption.color || '#60a5fa',
                  }}
                >
                  <IconHelper name={selectedOption.iconName} className="w-3.5 h-3.5" />
                </div>
              )}
              <span className="text-content font-medium truncate">{selectedOption.label}</span>
              <span className="text-xs text-content-muted font-mono shrink-0">({selectedOption.id})</span>
            </>
          ) : (
            <span className="text-content-muted">{placeholder}</span>
          )}
        </div>
        <ChevronDown
          className={`w-4 h-4 text-content-muted shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-blue-500 dark:text-blue-400' : ''
          }`}
        />
      </button>

      {/* Portal dropdown — rendered at document.body to escape overflow clipping */}
      {isClient && isOpen &&
        createPortal(
          <div
            ref={popoverRef}
            id={listboxId}
            role="listbox"
            aria-labelledby={label ? `${dropdownId}-label` : undefined}
            style={portalStyle}
            className="bg-surface-card border border-edge-strong rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-72"
          >
            {/* Search */}
            <div className="p-2.5 border-b border-edge bg-surface-elevated/60 shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-content-muted pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setHighlightedIndex(0);
                  }}
                  onKeyDown={handleSearchKeyDown}
                  placeholder={searchPlaceholder}
                  className="w-full pl-9 pr-3 py-1.5 bg-surface-input border border-edge-strong rounded-xl text-content text-xs placeholder-content-muted focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                />
              </div>
            </div>

            {/* Options list */}
            <div
              ref={listRef}
              tabIndex={-1}
              className="overflow-y-auto p-1.5 space-y-0.5 flex-1 min-h-0 custom-scrollbar"
            >
              {filteredOptions.length === 0 ? (
                <div className="py-6 text-center text-xs text-content-muted italic">
                  No matching options found
                </div>
              ) : (
                filteredOptions.map((opt, idx) => {
                  const isSelected = opt.id === value;
                  const isHighlighted = idx === highlightedIndex;
                  return (
                    <button
                      key={opt.id}
                      ref={(el) => {
                        optionRefs.current[idx] = el;
                      }}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      tabIndex={0}
                      onClick={() => handleSelectOption(opt)}
                      onMouseEnter={() => setHighlightedIndex(idx)}
                      onKeyDown={(e) => handleOptionKeyDown(e, idx, opt)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs transition cursor-pointer focus:outline-none ${
                        isHighlighted
                          ? 'bg-blue-600/15 text-blue-600 dark:text-blue-400 ring-1 ring-blue-500/40'
                          : isSelected
                          ? 'bg-surface-elevated text-blue-600 dark:text-blue-400 font-semibold'
                          : 'text-content-secondary hover:bg-surface-elevated'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 pr-2">
                        {opt.iconName && (
                          <div
                            className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 border"
                            style={{
                              backgroundColor: opt.color ? `${opt.color}20` : 'rgba(59,130,246,0.15)',
                              borderColor: opt.color ? `${opt.color}50` : 'rgba(59,130,246,0.3)',
                              color: opt.color || '#60a5fa',
                            }}
                          >
                            <IconHelper name={opt.iconName} className="w-3.5 h-3.5" />
                          </div>
                        )}
                        <div className="truncate">
                          <div className="font-semibold text-content flex items-center gap-1.5">
                            <span>{opt.label}</span>
                            <span className="text-[10px] text-content-muted font-mono">({opt.id})</span>
                          </div>
                          {opt.sublabel && (
                            <p className="text-[11px] text-content-muted truncate mt-0.5">{opt.sublabel}</p>
                          )}
                        </div>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-blue-500 dark:text-blue-400 shrink-0 ml-2" />}
                    </button>
                  );
                })
              )}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
