'use client';

import React, { useState, useRef, useEffect, useId, useCallback, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Search, Check } from 'lucide-react';
import { IconHelper } from '@/components/ui/IconHelper';

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

  // Calculate dropdown position relative to viewport
  const calculatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const DROPDOWN_HEIGHT = 288; // max-h-72
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUpward = spaceBelow < DROPDOWN_HEIGHT && rect.top > DROPDOWN_HEIGHT;
    setPosition({
      top: openUpward ? rect.top - 8 : rect.bottom + 6,
      left: rect.left,
      width: rect.width,
      openUpward,
    });
  }, []);

  const openDropdown = useCallback(() => {
    calculatePosition();
    const currentIdx = options.findIndex((opt) => opt.id === value);
    setHighlightedIndex(currentIdx >= 0 ? currentIdx : 0);
    setSearch('');
    setIsOpen(true);
  }, [calculatePosition, options, value]);

  const closeDropdown = useCallback((refocusTrigger = true) => {
    setIsOpen(false);
    setSearch('');
    if (refocusTrigger) {
      setTimeout(() => triggerRef.current?.focus(), 0);
    }
  }, []);

  // Update position on scroll / resize while open
  useEffect(() => {
    if (!isOpen) return;
    const handleUpdate = () => calculatePosition();
    window.addEventListener('scroll', handleUpdate, true);
    window.addEventListener('resize', handleUpdate);
    return () => {
      window.removeEventListener('scroll', handleUpdate, true);
      window.removeEventListener('resize', handleUpdate);
    };
  }, [isOpen, calculatePosition]);

  // Close on click outside (trigger + portal popover)
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        !containerRef.current?.contains(target) &&
        !popoverRef.current?.contains(target)
      ) {
        setIsOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Focus search input after open
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => searchInputRef.current?.focus(), 50);
    return () => clearTimeout(timer);
  }, [isOpen]);

  // Scroll highlighted option into view
  useEffect(() => {
    if (!isOpen || highlightedIndex < 0 || highlightedIndex >= filteredOptions.length) return;
    optionRefs.current[highlightedIndex]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [isOpen, highlightedIndex, filteredOptions.length]);

  const handleSelectOption = (opt: DropdownOption) => {
    onChange(opt.id);
    closeDropdown(true);
  };

  const handleTriggerKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
      e.preventDefault();
      if (isOpen) { closeDropdown(false); } else { openDropdown(); }
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') { e.preventDefault(); closeDropdown(true); return; }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (filteredOptions.length > 0) setHighlightedIndex((p) => (p + 1) % filteredOptions.length);
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (filteredOptions.length > 0) setHighlightedIndex((p) => (p - 1 + filteredOptions.length) % filteredOptions.length);
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredOptions.length > 0 && highlightedIndex >= 0 && highlightedIndex < filteredOptions.length)
        handleSelectOption(filteredOptions[highlightedIndex]);
      return;
    }
    if (e.key === 'Tab' && !e.shiftKey && filteredOptions.length > 0) {
      e.preventDefault();
      optionRefs.current[highlightedIndex >= 0 ? highlightedIndex : 0]?.focus();
    }
  };

  const handleOptionKeyDown = (
    e: React.KeyboardEvent<HTMLButtonElement>,
    idx: number,
    opt: DropdownOption
  ) => {
    if (e.key === 'Escape') { e.preventDefault(); closeDropdown(true); return; }
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleSelectOption(opt); return; }
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
      if (e.shiftKey) { e.preventDefault(); searchInputRef.current?.focus(); }
      else { closeDropdown(false); }
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
      <label
        id={`${dropdownId}-label`}
        className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2"
      >
        {icon}
        {label}
      </label>

      {/* Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-labelledby={`${dropdownId}-label`}
        disabled={disabled}
        onClick={() => (isOpen ? closeDropdown(false) : openDropdown())}
        onKeyDown={handleTriggerKeyDown}
        className={`w-full flex items-center justify-between px-3.5 py-2.5 bg-slate-950/60 border rounded-xl text-left text-sm transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
          isOpen
            ? 'border-blue-500 ring-2 ring-blue-500/30'
            : 'border-slate-700 hover:border-slate-600'
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
              <span className="text-slate-100 font-medium truncate">{selectedOption.label}</span>
              <span className="text-xs text-slate-500 font-mono shrink-0">({selectedOption.id})</span>
            </>
          ) : (
            <span className="text-slate-500">{placeholder}</span>
          )}
        </div>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-blue-400' : ''
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
            aria-labelledby={`${dropdownId}-label`}
            style={portalStyle}
            className="bg-slate-900 border border-slate-700/90 rounded-2xl shadow-2xl shadow-black/80 overflow-hidden flex flex-col max-h-72"
          >
            {/* Search */}
            <div className="p-2.5 border-b border-slate-800 bg-slate-950/80 shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setHighlightedIndex(0); }}
                  onKeyDown={handleSearchKeyDown}
                  placeholder={searchPlaceholder}
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-slate-100 text-xs placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Options list */}
            <div
              ref={listRef}
              tabIndex={-1}
              className="overflow-y-auto p-1.5 space-y-0.5 flex-1 min-h-0"
              style={{ scrollbarWidth: 'thin', scrollbarColor: '#334155 transparent' }}
            >
              {filteredOptions.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-500 italic">
                  No matching options found
                </div>
              ) : (
                filteredOptions.map((opt, idx) => {
                  const isSelected = opt.id === value;
                  const isHighlighted = idx === highlightedIndex;
                  return (
                    <button
                      key={opt.id}
                      ref={(el) => { optionRefs.current[idx] = el; }}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      tabIndex={0}
                      onClick={() => handleSelectOption(opt)}
                      onMouseEnter={() => setHighlightedIndex(idx)}
                      onKeyDown={(e) => handleOptionKeyDown(e, idx, opt)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs transition cursor-pointer focus:outline-none ${
                        isHighlighted
                          ? 'bg-blue-600/20 text-white ring-1 ring-blue-500/40'
                          : isSelected
                          ? 'bg-slate-800/80 text-blue-300'
                          : 'text-slate-300 hover:bg-slate-800/60'
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
                          <div className="font-semibold text-slate-100 flex items-center gap-1.5">
                            <span>{opt.label}</span>
                            <span className="text-[10px] text-slate-500 font-mono">({opt.id})</span>
                          </div>
                          {opt.sublabel && (
                            <p className="text-[11px] text-slate-400 truncate mt-0.5">{opt.sublabel}</p>
                          )}
                        </div>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-blue-400 shrink-0 ml-2" />}
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
