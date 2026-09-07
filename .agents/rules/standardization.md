# Standardization & Architectural Rules: Motion, Modals, Haptics & Responsive Mobile

These rules are enforced across all components in the `icebreaker-questions` project.

## 1. Motion Tokens & Physics (`src/lib/motion.ts`)
- Never use arbitrary `transition={{ duration: 0.3, ease: 'easeInOut' }}` in framer-motion components.
- Always use the centralized `SPRING_PHYSICS` springs:
  - `SPRING_PHYSICS.snappy`: `stiffness: 400, damping: 28` (fast tap interactions, buttons, icons).
  - `SPRING_PHYSICS.modal`: `stiffness: 300, damping: 30` (sheet/modal transitions).
  - `SPRING_PHYSICS.gentle`: `stiffness: 220, damping: 25` (card flips, ambient reveals).
- Bottom sheet drag dismissals must use `DRAG_CONFIG` and `shouldDismissSheet(info)`.
- Use shared variants: `BACKDROP_VARIANTS`, `BOTTOM_SHEET_VARIANTS`, `FADE_IN_SCALE_VARIANTS`.

## 2. Standardized Modal Shell (`src/components/ui/ModalShell.tsx`)
- All dialogs, sheets, and popovers must use `ModalShell`.
- Hand-crafted `fixed inset-0` overlays are strictly prohibited.
- **Never wrap `<ModalShell>` with `{isOpen && <ModalShell />}` or outer `<AnimatePresence>`**: Always pass `isOpen={isOpen}` directly. Conditional unmounting in parent cuts off the exit slide-down transition.
- `ModalShell` provides:
  - Responsive mobile bottom sheet (`< sm`) and desktop modal (`>= sm`).
  - Gesture-based drag-to-dismiss on mobile with haptics.
  - Smooth slide-down exit animation (`[0.32, 0.72, 0, 1]` curve).
  - Safe area padding on mobile devices (`pb-safe`).
  - Scroll lock on `document.body` while open.
  - Portaling into `document.body`.

## 3. Mobile Gesture Conflict Prevention
- For any bottom sheet with scrollable content:
  - Use `drag="y"`, `dragListener={false}`, and `dragControls={dragControls}`.
  - Only initiate drag from the drag handle / header (`dragControls.start(e)`).
  - The content body MUST remain `overflow-y-auto` with native touch scrolling untouched.

## 4. Haptic Feedback (`src/lib/haptics.ts`)
- Use `hapticFeedback` (`light()`, `medium()`, `success()`, `warning()`).
- Always trigger haptics on tactile actions:
  - `light()`: Chip toggles, filter select, drag handle tap.
  - `medium()`: Favorite toggle, question asked toggle, modal close.
  - `success()`: Question save, export/import finish.
  - `warning()`: Deletion confirmation, invalid actions.

## 5. Smooth Numerical Counters (`src/hooks/useCountUp.ts`)
- Any dynamic statistics or number counts must animate with `useCountUp(value, 600)`.

## 6. Zero Native Select Elements
- `<select>` is banned. Use `SearchableDropdown` from `@/components/admin/SearchableDropdown` or inline button groups.
