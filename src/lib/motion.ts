import { Transition, Variants } from 'framer-motion';

/**
 * Standardized Spring Physics Configurations
 * Centralized motion tokens ensuring consistent feel across the entire app.
 */
export const SPRING_PHYSICS = {
  // Balanced spring for modals and bottom sheets (Apple-like natural weight)
  modal: {
    type: 'spring' as const,
    damping: 28,
    stiffness: 320,
    mass: 0.8,
  } satisfies Transition,

  // Bouncy spring for micro-interactions (favorite heart, badges, confetti triggers)
  bouncy: {
    type: 'spring' as const,
    damping: 15,
    stiffness: 400,
    mass: 0.6,
  } satisfies Transition,

  // Snappy responsive spring for interactive elements (tabs, tooltips, pills)
  snappy: {
    type: 'spring' as const,
    damping: 25,
    stiffness: 450,
    mass: 0.5,
  } satisfies Transition,

  // Gentle transition for ambient reveals and backdrop fades
  gentle: {
    duration: 0.22,
    ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
  } satisfies Transition,
};

/**
 * Drag to dismiss parameters for mobile bottom sheets
 */
export const DRAG_CONFIG = {
  sheetConstraints: { top: 0, bottom: 0 },
  sheetElastic: { top: 0.05, bottom: 0.6 },
  thresholdOffset: 100, // minimum pixels pulled downward to trigger close
  thresholdVelocity: 450, // minimum flick velocity downward to trigger close
};

/**
 * Helper to evaluate whether a vertical drag gesture should dismiss the sheet
 */
export function shouldDismissSheet(offsetY: number, velocityY: number): boolean {
  return offsetY > DRAG_CONFIG.thresholdOffset || velocityY > DRAG_CONFIG.thresholdVelocity;
}

/**
 * Shared Framer Motion Variants
 */
export const BACKDROP_VARIANTS: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.22 } },
  exit: { opacity: 0, transition: { duration: 0.28, ease: 'easeOut' } },
};

export const BOTTOM_SHEET_VARIANTS: Variants = {
  hidden: { y: '100%', opacity: 1 },
  visible: {
    y: 0,
    opacity: 1,
    transition: SPRING_PHYSICS.modal,
  },
  exit: {
    y: '100%',
    opacity: 1,
    transition: {
      duration: 0.28,
      ease: [0.32, 0.72, 0, 1],
    },
  },
};

export const FADE_SCALE_VARIANTS: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: SPRING_PHYSICS.snappy,
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    transition: { duration: 0.15 },
  },
};

export const STAGGER_CONTAINER_VARIANTS: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.02,
    },
  },
};

export const STAGGER_ITEM_VARIANTS: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: SPRING_PHYSICS.snappy,
  },
};
