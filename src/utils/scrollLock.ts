/**
 * Scroll Lock Utility with Mobile Detection and Safety Mechanisms
 * Prevents modal scroll trapping on mobile devices and provides escape hatches
 */

interface ScrollLockState {
  isLocked: boolean;
  originalOverflow: string;
  originalPosition: string;
  scrollPosition: number;
  lockCount: number;
  timeoutId?: NodeJS.Timeout;
  escapeTimeoutId?: NodeJS.Timeout;
}

const state: ScrollLockState = {
  isLocked: false,
  originalOverflow: '',
  originalPosition: '',
  scrollPosition: 0,
  lockCount: 0,
};

// Mobile detection utility
const isMobileDevice = (): boolean => {
  if (typeof window === 'undefined') return false;

  return (
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    ('ontouchstart' in window) ||
    (window.innerWidth <= 768) ||
    (navigator.maxTouchPoints > 0)
  );
};

// iOS specific detection
const isIOS = (): boolean => {
  if (typeof window === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
};

// Force unlock utility for emergency situations
const forceUnlock = (): void => {
  console.warn('[ScrollLock] Force unlocking scroll due to safety timeout');

  if (state.timeoutId) {
    clearTimeout(state.timeoutId);
    state.timeoutId = undefined;
  }

  if (state.escapeTimeoutId) {
    clearTimeout(state.escapeTimeoutId);
    state.escapeTimeoutId = undefined;
  }

  document.body.style.overflow = state.originalOverflow;
  document.body.style.position = state.originalPosition;

  // Restore scroll position
  if (state.scrollPosition > 0) {
    window.scrollTo(0, state.scrollPosition);
  }

  state.isLocked = false;
  state.lockCount = 0;

  // Dispatch custom event for cleanup
  window.dispatchEvent(new CustomEvent('scrollLockForceUnlocked'));
};

// Add global escape mechanisms
const addGlobalEscapeHandlers = (): void => {
  // Escape key handler
  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && state.isLocked) {
      console.log('[ScrollLock] Escape key pressed, attempting to unlock');
      forceUnlock();
    }
  };

  // Triple tap/click handler for mobile escape
  let tapCount = 0;
  let tapTimeout: NodeJS.Timeout;

  const handleTripleTap = (e: TouchEvent | MouseEvent) => {
    if (!state.isLocked) return;

    tapCount++;

    if (tapTimeout) {
      clearTimeout(tapTimeout);
    }

    if (tapCount === 3) {
      console.log('[ScrollLock] Triple tap detected, force unlocking');
      forceUnlock();
      tapCount = 0;
      return;
    }

    tapTimeout = setTimeout(() => {
      tapCount = 0;
    }, 500);
  };

  document.addEventListener('keydown', handleEscape);
  document.addEventListener('touchstart', handleTripleTap);
  document.addEventListener('click', handleTripleTap);

  // Store cleanup function
  (window as any).__scrollLockCleanup = () => {
    document.removeEventListener('keydown', handleEscape);
    document.removeEventListener('touchstart', handleTripleTap);
    document.removeEventListener('click', handleTripleTap);
  };
};

// Remove global escape handlers
const removeGlobalEscapeHandlers = (): void => {
  if ((window as any).__scrollLockCleanup) {
    (window as any).__scrollLockCleanup();
    delete (window as any).__scrollLockCleanup;
  }
};

/**
 * Lock body scroll with mobile-specific handling and safety mechanisms
 */
export const lockScroll = (options: {
  timeout?: number;
  bypassMobile?: boolean;
  emergencyTimeout?: number;
} = {}): void => {
  const {
    timeout = 30000, // 30 second safety timeout
    bypassMobile = false,
    emergencyTimeout = 60000 // 60 second emergency timeout
  } = options;

  // Increment lock count for nested modals
  state.lockCount++;

  if (state.isLocked) {
    console.log(`[ScrollLock] Already locked, count: ${state.lockCount}`);
    return;
  }

  // On mobile, only lock if explicitly requested
  if (isMobileDevice() && !bypassMobile) {
    console.log('[ScrollLock] Mobile device detected, skipping scroll lock');
    return;
  }

  console.log('[ScrollLock] Locking scroll');

  // Store current state
  state.originalOverflow = document.body.style.overflow;
  state.originalPosition = document.body.style.position;
  state.scrollPosition = window.pageYOffset || document.documentElement.scrollTop;

  // Apply scroll lock
  document.body.style.overflow = 'hidden';

  // Special handling for iOS
  if (isIOS()) {
    document.body.style.position = 'fixed';
    document.body.style.top = `-${state.scrollPosition}px`;
    document.body.style.width = '100%';
  }

  state.isLocked = true;

  // Add global escape handlers
  addGlobalEscapeHandlers();

  // Safety timeout to prevent permanent locking
  if (timeout > 0) {
    state.timeoutId = setTimeout(() => {
      console.warn(`[ScrollLock] Safety timeout reached (${timeout}ms), unlocking scroll`);
      forceUnlock();
    }, timeout);
  }

  // Emergency timeout as last resort
  if (emergencyTimeout > 0) {
    state.escapeTimeoutId = setTimeout(() => {
      console.error(`[ScrollLock] Emergency timeout reached (${emergencyTimeout}ms), force unlocking`);
      forceUnlock();
    }, emergencyTimeout);
  }

  // Dispatch event
  window.dispatchEvent(new CustomEvent('scrollLocked'));
};

/**
 * Unlock body scroll with proper cleanup
 */
export const unlockScroll = (): void => {
  // Decrement lock count
  state.lockCount = Math.max(0, state.lockCount - 1);

  if (state.lockCount > 0) {
    console.log(`[ScrollLock] Still locked by other modals, count: ${state.lockCount}`);
    return;
  }

  if (!state.isLocked) {
    console.log('[ScrollLock] Not currently locked');
    return;
  }

  console.log('[ScrollLock] Unlocking scroll');

  // Clear timeouts
  if (state.timeoutId) {
    clearTimeout(state.timeoutId);
    state.timeoutId = undefined;
  }

  if (state.escapeTimeoutId) {
    clearTimeout(state.escapeTimeoutId);
    state.escapeTimeoutId = undefined;
  }

  // Restore original styles
  document.body.style.overflow = state.originalOverflow;
  document.body.style.position = state.originalPosition;
  document.body.style.top = '';
  document.body.style.width = '';

  // Restore scroll position for iOS
  if (isIOS() && state.scrollPosition > 0) {
    window.scrollTo(0, state.scrollPosition);
  }

  state.isLocked = false;

  // Remove global escape handlers when no locks remain
  removeGlobalEscapeHandlers();

  // Dispatch event
  window.dispatchEvent(new CustomEvent('scrollUnlocked'));
};

/**
 * Get current scroll lock state
 */
export const getScrollLockState = () => ({
  isLocked: state.isLocked,
  lockCount: state.lockCount,
  isMobile: isMobileDevice(),
  isIOS: isIOS(),
});

/**
 * Emergency unlock function for use in dev tools or error handlers
 */
export const emergencyUnlock = forceUnlock;

/**
 * Hook for React components to manage scroll locking
 */
export const useScrollLock = () => {
  return {
    lockScroll,
    unlockScroll,
    forceUnlock,
    getState: getScrollLockState,
    isMobile: isMobileDevice(),
  };
};

// Add global emergency unlock to window for debugging
if (typeof window !== 'undefined') {
  (window as any).__emergencyUnlockScroll = forceUnlock;

  // Add warning in console about emergency unlock
  console.log(
    '%c[ScrollLock] Emergency unlock available via window.__emergencyUnlockScroll() or triple-tap/Escape key',
    'color: #ff6b6b; font-weight: bold;'
  );
}