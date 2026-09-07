/**
 * Haptic Feedback Utilities
 * SSR-safe, zero-dependency tactile feedback for supported mobile devices.
 */
export const hapticFeedback = {
  /**
   * Subtle tick for light taps (category chips, tab switches, dropdown items)
   */
  light: () => {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      try {
        navigator.vibrate(10);
      } catch {
        // Silently ignore if blocked by browser policy
      }
    }
  },

  /**
   * Medium bump for noticeable interactions (roulette spin, open modal, stage launch)
   */
  medium: () => {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      try {
        navigator.vibrate(22);
      } catch {
        // Silently ignore
      }
    }
  },

  /**
   * Double vibration pattern for positive confirmation (saved question, marked as asked, favorite)
   */
  success: () => {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      try {
        navigator.vibrate([15, 40, 20]);
      } catch {
        // Silently ignore
      }
    }
  },

  /**
   * Distinct vibration for destructive/warning actions (delete modal open, reset asked)
   */
  warning: () => {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      try {
        navigator.vibrate([30, 60, 30]);
      } catch {
        // Silently ignore
      }
    }
  },
};
