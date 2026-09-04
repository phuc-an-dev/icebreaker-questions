'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Check, Keyboard, Palette, Plus } from 'lucide-react';
import { CategoryMeta, TypeMeta } from '@/types/question';
import { IconHelper } from '@/components/ui/IconHelper';

interface CategoryTypeModalProps {
  isOpen: boolean;
  mode: 'category' | 'type';
  initialData: CategoryMeta | TypeMeta | null;
  isSubmitting?: boolean;
  onClose: () => void;
  onSubmitCategory?: (cat: CategoryMeta) => Promise<void>;
  onSubmitType?: (type: TypeMeta) => Promise<void>;
}

// ─── Extended icon set ────────────────────────────────────────────────────────
const COMMON_ICONS = [
  // People & social
  'Users', 'UsersRound', 'UserCheck', 'UserPlus', 'HeartHandshake', 'Heart',
  // Fun & play
  'Sparkles', 'Smile', 'Laugh', 'PartyPopper', 'Gamepad2', 'Dice5',
  // Work & growth
  'Briefcase', 'TrendingUp', 'BarChart2', 'Target', 'Award', 'Trophy',
  // Learning & knowledge
  'Lightbulb', 'Book', 'BookOpen', 'GraduationCap', 'Compass', 'Globe',
  // Nature & wellness
  'Flame', 'Leaf', 'Sun', 'Moon', 'Cloud', 'Zap',
  // Communication
  'MessageSquareQuote', 'MessageCircle', 'Mic', 'Megaphone', 'Radio', 'Volume2',
  // Activity & hobbies
  'Music', 'Camera', 'Coffee', 'Utensils', 'Palette', 'Brush',
  // Tech & tools
  'Rocket', 'Code2', 'Cpu', 'Link2', 'Globe2', 'Wifi',
  // Misc
  'Star', 'Shield', 'Lock', 'Key', 'FilePenLine', 'Scale',
  'RotateCcw', 'Sliders', 'Vote', 'Theater', 'History', 'HelpCircle',
];

// ─── Preset color swatches ─────────────────────────────────────────────────
const PRESET_COLORS = [
  '#3b82f6', // blue
  '#06b6d4', // cyan
  '#10b981', // emerald
  '#84cc16', // lime
  '#f59e0b', // amber
  '#f97316', // orange
  '#ef4444', // red
  '#f43f5e', // rose
  '#ec4899', // pink
  '#a855f7', // purple
  '#6366f1', // indigo
  '#14b8a6', // teal
  '#64748b', // slate
  '#78716c', // stone
  '#d97706', // yellow-dark
  '#7c3aed', // violet
];

interface InnerProps {
  mode: 'category' | 'type';
  initialData: CategoryMeta | TypeMeta | null;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmitCategory?: (cat: CategoryMeta) => Promise<void>;
  onSubmitType?: (type: TypeMeta) => Promise<void>;
}

function CategoryTypeInner({
  mode,
  initialData,
  isSubmitting,
  onClose,
  onSubmitCategory,
  onSubmitType,
}: InnerProps) {
  const isEditing = !!initialData;

  const [id, setId] = useState(initialData?.id || '');
  const [label, setLabel] = useState(initialData?.label || '');
  const [descriptionOrHint, setDescriptionOrHint] = useState(
    mode === 'category'
      ? (initialData as CategoryMeta)?.description || ''
      : (initialData as TypeMeta)?.hint || ''
  );
  const [color, setColor] = useState(
    mode === 'category' ? (initialData as CategoryMeta)?.color || '#3b82f6' : '#3b82f6'
  );
  const [showCustomColorPicker, setShowCustomColorPicker] = useState(false);
  const [iconName, setIconName] = useState(
    initialData?.iconName || (mode === 'category' ? 'Sparkles' : 'MessageSquareQuote')
  );
  const [error, setError] = useState<string | null>(null);

  const labelRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const colorSwatchRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const nativeColorRef = useRef<HTMLInputElement>(null);
  const iconRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [focusedColorIdx, setFocusedColorIdx] = useState(() =>
    PRESET_COLORS.indexOf(mode === 'category' ? (initialData as CategoryMeta)?.color || '#3b82f6' : '#3b82f6')
  );
  const [focusedIconIdx, setFocusedIconIdx] = useState(() => {
    const initial = initialData?.iconName || (mode === 'category' ? 'Sparkles' : 'MessageSquareQuote');
    const idx = COMMON_ICONS.indexOf(initial);
    return idx >= 0 ? idx : 0;
  });

  // Auto-focus label on open
  useEffect(() => {
    const t = setTimeout(() => labelRef.current?.focus(), 80);
    return () => clearTimeout(t);
  }, []);

  // Esc → close, Ctrl+Enter → submit
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) { onClose(); return; }
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && !isSubmitting) {
        e.preventDefault();
        formRef.current?.requestSubmit();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isSubmitting, onClose]);

  const handleIdFromLabel = (newLabel: string) => {
    setLabel(newLabel);
    if (!isEditing) {
      const generated = newLabel
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setId(generated);
    }
  };

  // Roving tabindex keyboard nav for color swatches
  // Tab moves to icon grid; Arrow keys navigate within swatches
  const handleSwatchKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, idx: number) => {
    const total = PRESET_COLORS.length;
    const cols = 8;
    let next = -1;
    if (e.key === 'ArrowRight') { e.preventDefault(); next = (idx + 1) % total; }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); next = (idx - 1 + total) % total; }
    else if (e.key === 'ArrowDown') { e.preventDefault(); next = Math.min(idx + cols, total - 1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); next = Math.max(idx - cols, 0); }
    else if (e.key === 'Tab' && !e.shiftKey) {
      // Skip rest of color group — jump to icon grid
      e.preventDefault();
      const activeIcon = COMMON_ICONS.indexOf(iconName);
      iconRefs.current[activeIcon >= 0 ? activeIcon : 0]?.focus();
      return;
    }
    if (next >= 0) {
      setFocusedColorIdx(next);
      colorSwatchRefs.current[next]?.focus();
    }
  };

  // Roving tabindex keyboard nav for icon grid
  const ICON_COLS = 6;
  const handleIconKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, idx: number) => {
    const total = COMMON_ICONS.length;
    let next = -1;
    if (e.key === 'ArrowRight') { e.preventDefault(); next = (idx + 1) % total; }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); next = (idx - 1 + total) % total; }
    else if (e.key === 'ArrowDown') { e.preventDefault(); next = Math.min(idx + ICON_COLS, total - 1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); next = Math.max(idx - ICON_COLS, 0); }
    if (next >= 0) {
      setFocusedIconIdx(next);
      iconRefs.current[next]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id.trim() || !label.trim()) {
      setError('Both ID and Label are required.');
      return;
    }
    try {
      setError(null);
      if (mode === 'category' && onSubmitCategory) {
        const cat: CategoryMeta = {
          id: id.trim().toLowerCase(),
          label: label.trim(),
          description: descriptionOrHint.trim(),
          color: color || '#3b82f6',
          gradient: `linear-gradient(135deg, ${color || '#3b82f6'} 0%, #1e40af 100%)`,
          glowColor: `${color || '#3b82f6'}40`,
          borderGlow: `${color || '#3b82f6'}80`,
          iconName,
        };
        await onSubmitCategory(cat);
      } else if (mode === 'type' && onSubmitType) {
        await onSubmitType({
          id: id.trim().toLowerCase(),
          label: label.trim(),
          hint: descriptionOrHint.trim(),
          iconName,
        });
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center border transition"
              style={{
                backgroundColor: mode === 'category' ? `${color}20` : '#3b82f620',
                borderColor: mode === 'category' ? `${color}50` : '#3b82f650',
                color: mode === 'category' ? color : '#60a5fa',
              }}
            >
              <IconHelper name={iconName} className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {isEditing
                  ? `Edit ${mode === 'category' ? 'Category' : 'Question Type'}`
                  : `New ${mode === 'category' ? 'Category' : 'Question Type'}`}
              </h2>
              <p className="text-xs text-slate-400">
                Configure display label, icon, and visual attributes
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form ref={formRef} onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1 custom-scrollbar">
          {error && (
            <div className="p-3 text-sm text-red-400 bg-red-950/40 border border-red-800/40 rounded-xl">
              {error}
            </div>
          )}

          {/* Display Name */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Display Name / Label *
            </label>
            <input
              ref={labelRef}
              type="text"
              value={label}
              onChange={(e) => handleIdFromLabel(e.target.value)}
              placeholder={mode === 'category' ? 'e.g. Science & Space' : 'e.g. Speed Round'}
              required
              className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-700 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* ID Key */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Unique ID Key *
            </label>
            <input
              type="text"
              value={id}
              onChange={(e) => setId(e.target.value)}
              disabled={isEditing}
              placeholder="e.g. science-space"
              required
              className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-700 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-blue-500 disabled:opacity-60 disabled:cursor-not-allowed font-mono text-xs"
            />
          </div>

          {/* Description / Hint */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              {mode === 'category' ? 'Description' : 'Format Hint / Instructions'}
            </label>
            <input
              type="text"
              value={descriptionOrHint}
              onChange={(e) => setDescriptionOrHint(e.target.value)}
              placeholder={
                mode === 'category'
                  ? 'Brief explanation of this theme'
                  : 'How players should respond'
              }
              className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-700 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Color — category only */}
          {mode === 'category' && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Category Accent Color
              </label>

              {/* Swatch grid — Tab/Arrow to navigate, Enter/Space to select */}
              <div
                className="flex flex-wrap gap-2 p-2 bg-slate-950/40 border border-slate-800 rounded-xl"
                role="radiogroup"
                aria-label="Color swatches"
              >
                {PRESET_COLORS.map((c, idx) => (
                  <button
                    key={c}
                    ref={(el) => { colorSwatchRefs.current[idx] = el; }}
                    type="button"
                    role="radio"
                    aria-checked={color === c}
                    aria-label={c}
                    tabIndex={focusedColorIdx === idx || (focusedColorIdx < 0 && idx === 0) ? 0 : -1}
                    onClick={() => { setColor(c); setFocusedColorIdx(idx); }}
                    onFocus={() => setFocusedColorIdx(idx)}
                    onKeyDown={(e) => handleSwatchKeyDown(e, idx)}
                    className="w-7 h-7 rounded-full border-2 transition-all focus:outline-none focus:ring-2 focus:ring-white/50 flex items-center justify-center"
                    style={{
                      backgroundColor: c,
                      borderColor: color === c ? '#ffffff' : 'transparent',
                      transform: color === c ? 'scale(1.2)' : 'scale(1)',
                    }}
                  >
                    {color === c && <Check className="w-3.5 h-3.5 text-white drop-shadow" />}
                  </button>
                ))}

                {/* Custom color toggle */}
                <button
                  type="button"
                  onClick={() => setShowCustomColorPicker((v) => !v)}
                  title="Custom color"
                  className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all focus:outline-none focus:ring-2 focus:ring-white/50 ${
                    showCustomColorPicker
                      ? 'border-blue-400 bg-blue-600/20 text-blue-400'
                      : 'border-slate-600 bg-slate-800 text-slate-400 hover:border-slate-400'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Custom picker — only shown on demand */}
              {showCustomColorPicker && (
                <div className="mt-2 flex items-center gap-3 p-3 bg-slate-950/60 border border-slate-800 rounded-xl">
                  {/* Color circle trigger — hidden native input behind a styled round button */}
                  <div className="relative w-10 h-10 shrink-0">
                    <div
                      className="w-10 h-10 rounded-full border-2 border-slate-600 cursor-pointer shadow-inner"
                      style={{ backgroundColor: color }}
                    />
                    <input
                      ref={nativeColorRef}
                      type="color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer rounded-full"
                      tabIndex={-1}
                      aria-label="Open color picker"
                    />
                  </div>
                  <input
                    type="text"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    placeholder="#3b82f6"
                    className="w-28 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-200 text-xs font-mono uppercase focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => nativeColorRef.current?.click()}
                    className="flex-1 h-8 rounded-lg border border-slate-700/60 cursor-pointer hover:border-slate-500 transition"
                    style={{ backgroundColor: color }}
                    title="Click to open color picker"
                  />
                  <div className="flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-xs text-slate-400">Custom</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Icon picker */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Select Icon
            </label>
            {/* 6 columns, 5 rows visible = max-h-[220px] */}
            <div
              className="grid grid-cols-6 gap-2 max-h-[220px] overflow-y-auto p-2 bg-slate-950/40 border border-slate-800 rounded-xl custom-scrollbar"
              role="radiogroup"
              aria-label="Icon selection"
            >
              {COMMON_ICONS.map((icon, idx) => {
                const isSelected = iconName === icon;
                const isFocused = focusedIconIdx === idx;
                return (
                  <button
                    key={icon}
                    ref={(el) => { iconRefs.current[idx] = el; }}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    tabIndex={isFocused ? 0 : -1}
                    onClick={() => { setIconName(icon); setFocusedIconIdx(idx); }}
                    onFocus={() => setFocusedIconIdx(idx)}
                    onKeyDown={(e) => handleIconKeyDown(e, idx)}
                    title={icon}
                    className={`h-9 flex items-center justify-center rounded-lg border transition focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                      isSelected
                        ? 'bg-blue-500/20 border-blue-500 text-blue-400 shadow-sm'
                        : 'border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <IconHelper name={icon} className="w-4 h-4" />
                  </button>
                );
              })}
            </div>
            {/* Selected icon preview */}
            <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
              <IconHelper name={iconName} className="w-3.5 h-3.5 text-blue-400" />
              <span className="font-mono text-slate-400">{iconName}</span>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-800">
            {/* Keyboard hint */}
            <div className="hidden sm:flex items-center gap-2 text-slate-600">
              <Keyboard className="w-3.5 h-3.5" />
              <span className="text-[11px]">
                <kbd className="px-1 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-400 font-mono text-[10px]">Esc</kbd>
                {' '}cancel
                {' · '}
                <kbd className="px-1 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-400 font-mono text-[10px]">Ctrl</kbd>
                {' + '}
                <kbd className="px-1 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-400 font-mono text-[10px]">Enter</kbd>
                {' '}save
              </span>
            </div>
            <div className="flex items-center gap-3 ml-auto">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700/80 border border-slate-700 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-lg shadow-blue-600/30 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmitting && (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                )}
                {isEditing ? 'Save Changes' : 'Create'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export const CategoryTypeModal: React.FC<CategoryTypeModalProps> = ({
  isOpen,
  mode,
  initialData,
  isSubmitting = false,
  onClose,
  onSubmitCategory,
  onSubmitType,
}) => {
  if (!isOpen) return null;
  return (
    <CategoryTypeInner
      key={initialData ? `${mode}-${initialData.id}` : `new-${mode}`}
      mode={mode}
      initialData={initialData}
      isSubmitting={isSubmitting}
      onClose={onClose}
      onSubmitCategory={onSubmitCategory}
      onSubmitType={onSubmitType}
    />
  );
};
