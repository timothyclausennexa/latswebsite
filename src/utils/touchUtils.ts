/**
 * Touch interaction utilities optimized for iPhone 12-16
 * Provides haptic feedback, gesture detection, and touch optimization helpers
 */

export interface TouchEvent extends Event {
  touches: TouchList;
  changedTouches: TouchList;
  targetTouches: TouchList;
}

export interface TouchPoint {
  x: number;
  y: number;
  identifier: number;
  timestamp: number;
}

export interface SwipeGesture {
  direction: 'up' | 'down' | 'left' | 'right';
  distance: number;
  velocity: number;
  duration: number;
}

export interface PinchGesture {
  scale: number;
  velocity: number;
  center: { x: number; y: number };
}

export type HapticType = 'light' | 'medium' | 'heavy' | 'selection' | 'impactLight' | 'impactMedium' | 'impactHeavy' | 'notificationError' | 'notificationSuccess' | 'notificationWarning';

// Haptic feedback patterns
const HAPTIC_PATTERNS: Record<HapticType, number[]> = {
  light: [10],
  medium: [20],
  heavy: [40],
  selection: [10, 5, 10],
  impactLight: [5],
  impactMedium: [15],
  impactHeavy: [30],
  notificationError: [50, 25, 50],
  notificationSuccess: [10, 5, 10, 5, 10],
  notificationWarning: [30, 15, 30],
};

/**
 * Haptic Feedback System
 */
export class HapticFeedback {
  private static isSupported: boolean | null = null;
  private static lastHapticTime = 0;
  private static readonly HAPTIC_THROTTLE = 50; // 50ms throttle

  static isHapticSupported(): boolean {
    if (this.isSupported !== null) return this.isSupported;

    this.isSupported = (
      'vibrate' in navigator ||
      'hapticFeedback' in navigator ||
      ('userAgentData' in navigator && navigator.userAgentData?.mobile) ||
      /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
    );

    return this.isSupported;
  }

  static trigger(type: HapticType = 'light'): void {
    if (!this.isHapticSupported()) return;

    const now = Date.now();
    if (now - this.lastHapticTime < this.HAPTIC_THROTTLE) return;
    this.lastHapticTime = now;

    try {
      // Try modern Vibration API
      if ('vibrate' in navigator) {
        const pattern = HAPTIC_PATTERNS[type] || HAPTIC_PATTERNS.light;
        navigator.vibrate(pattern);
        return;
      }

      // Fallback for iOS devices with limited vibration
      if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
        // iOS only supports basic vibration
        navigator.vibrate(HAPTIC_PATTERNS[type]?.[0] || 10);
      }
    } catch (error) {
      console.debug('Haptic feedback unavailable:', error);
    }
  }

  static triggerSuccess(): void {
    this.trigger('notificationSuccess');
  }

  static triggerError(): void {
    this.trigger('notificationError');
  }

  static triggerWarning(): void {
    this.trigger('notificationWarning');
  }

  static triggerSelection(): void {
    this.trigger('selection');
  }

  static triggerImpact(intensity: 'light' | 'medium' | 'heavy' = 'light'): void {
    this.trigger(`impact${intensity.charAt(0).toUpperCase() + intensity.slice(1)}` as HapticType);
  }
}

/**
 * Touch Target Utilities
 */
export class TouchTarget {
  // iPhone minimum touch target recommendation (44px)
  static readonly MIN_TOUCH_SIZE = 44;

  static ensureMinimumSize(element: HTMLElement): void {
    const rect = element.getBoundingClientRect();
    const computedStyle = window.getComputedStyle(element);

    if (rect.width < this.MIN_TOUCH_SIZE || rect.height < this.MIN_TOUCH_SIZE) {
      const paddingX = Math.max(0, (this.MIN_TOUCH_SIZE - rect.width) / 2);
      const paddingY = Math.max(0, (this.MIN_TOUCH_SIZE - rect.height) / 2);

      element.style.paddingLeft = `${parseFloat(computedStyle.paddingLeft) + paddingX}px`;
      element.style.paddingRight = `${parseFloat(computedStyle.paddingRight) + paddingX}px`;
      element.style.paddingTop = `${parseFloat(computedStyle.paddingTop) + paddingY}px`;
      element.style.paddingBottom = `${parseFloat(computedStyle.paddingBottom) + paddingY}px`;
    }
  }

  static validateTouchTarget(element: HTMLElement): boolean {
    const rect = element.getBoundingClientRect();
    return rect.width >= this.MIN_TOUCH_SIZE && rect.height >= this.MIN_TOUCH_SIZE;
  }
}

/**
 * Gesture Recognition
 */
export class GestureRecognizer {
  private touchStart: TouchPoint | null = null;
  private touchHistory: TouchPoint[] = [];
  private readonly SWIPE_THRESHOLD = 30;
  private readonly SWIPE_MAX_TIME = 500;
  private readonly VELOCITY_THRESHOLD = 0.1;

  handleTouchStart(event: TouchEvent): void {
    if (event.touches.length === 1) {
      const touch = event.touches[0];
      this.touchStart = {
        x: touch.clientX,
        y: touch.clientY,
        identifier: touch.identifier,
        timestamp: Date.now(),
      };
      this.touchHistory = [this.touchStart];
    }
  }

  handleTouchMove(event: TouchEvent): void {
    if (event.touches.length === 1 && this.touchStart) {
      const touch = event.touches[0];
      const point: TouchPoint = {
        x: touch.clientX,
        y: touch.clientY,
        identifier: touch.identifier,
        timestamp: Date.now(),
      };
      this.touchHistory.push(point);

      // Keep only recent history for performance
      if (this.touchHistory.length > 10) {
        this.touchHistory.shift();
      }
    }
  }

  handleTouchEnd(event: TouchEvent): SwipeGesture | null {
    if (!this.touchStart || this.touchHistory.length < 2) {
      this.reset();
      return null;
    }

    const endPoint = this.touchHistory[this.touchHistory.length - 1];
    const deltaX = endPoint.x - this.touchStart.x;
    const deltaY = endPoint.y - this.touchStart.y;
    const duration = endPoint.timestamp - this.touchStart.timestamp;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    if (distance < this.SWIPE_THRESHOLD || duration > this.SWIPE_MAX_TIME) {
      this.reset();
      return null;
    }

    const velocity = distance / duration;
    if (velocity < this.VELOCITY_THRESHOLD) {
      this.reset();
      return null;
    }

    let direction: 'up' | 'down' | 'left' | 'right';
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      direction = deltaX > 0 ? 'right' : 'left';
    } else {
      direction = deltaY > 0 ? 'down' : 'up';
    }

    const gesture: SwipeGesture = {
      direction,
      distance,
      velocity,
      duration,
    };

    this.reset();
    return gesture;
  }

  private reset(): void {
    this.touchStart = null;
    this.touchHistory = [];
  }
}

/**
 * Touch Optimization Utilities
 */
export class TouchOptimizer {
  /**
   * Prevent default touch behaviors that interfere with custom gestures
   */
  static preventDefaults(element: HTMLElement): () => void {
    const preventDefault = (e: Event) => {
      e.preventDefault();
    };

    // Prevent common touch behaviors that can interfere
    element.addEventListener('touchstart', preventDefault, { passive: false });
    element.addEventListener('touchmove', preventDefault, { passive: false });
    element.addEventListener('touchend', preventDefault, { passive: false });

    // Prevent context menu on long touch
    element.addEventListener('contextmenu', preventDefault);

    // Prevent text selection
    element.style.userSelect = 'none';
    element.style.webkitUserSelect = 'none';
    element.style.touchAction = 'manipulation';

    return () => {
      element.removeEventListener('touchstart', preventDefault);
      element.removeEventListener('touchmove', preventDefault);
      element.removeEventListener('touchend', preventDefault);
      element.removeEventListener('contextmenu', preventDefault);
    };
  }

  /**
   * Enable smooth scrolling with momentum
   */
  static enableSmoothScroll(element: HTMLElement): void {
    element.style.webkitOverflowScrolling = 'touch';
    element.style.overflowScrolling = 'touch';
    element.style.scrollBehavior = 'smooth';
  }

  /**
   * Optimize element for touch interactions
   */
  static optimizeForTouch(element: HTMLElement): void {
    // Enable hardware acceleration
    element.style.transform = 'translateZ(0)';
    element.style.willChange = 'transform';

    // Optimize touch behavior
    element.style.touchAction = 'manipulation';
    element.style.webkitTapHighlightColor = 'transparent';

    // Ensure minimum touch target size
    TouchTarget.ensureMinimumSize(element);
  }

  /**
   * Add ripple effect for touch feedback
   */
  static addRippleEffect(element: HTMLElement, color = 'rgba(255, 255, 255, 0.3)'): () => void {
    let isAnimating = false;

    const handleTouch = (e: TouchEvent) => {
      if (isAnimating) return;
      isAnimating = true;

      const rect = element.getBoundingClientRect();
      const touch = e.touches[0] || e.changedTouches[0];
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;

      const ripple = document.createElement('div');
      ripple.style.position = 'absolute';
      ripple.style.borderRadius = '50%';
      ripple.style.backgroundColor = color;
      ripple.style.pointerEvents = 'none';
      ripple.style.left = `${x}px`;
      ripple.style.top = `${y}px`;
      ripple.style.width = '4px';
      ripple.style.height = '4px';
      ripple.style.transform = 'scale(0)';
      ripple.style.transition = 'transform 0.3s ease-out, opacity 0.3s ease-out';
      ripple.style.opacity = '1';

      // Ensure parent is positioned
      if (getComputedStyle(element).position === 'static') {
        element.style.position = 'relative';
      }
      element.style.overflow = 'hidden';

      element.appendChild(ripple);

      // Animate ripple
      requestAnimationFrame(() => {
        const size = Math.max(rect.width, rect.height) * 2;
        ripple.style.transform = `scale(${size / 4}) translate(-50%, -50%)`;
        ripple.style.opacity = '0';
      });

      // Clean up
      setTimeout(() => {
        ripple.remove();
        isAnimating = false;
      }, 300);
    };

    element.addEventListener('touchstart', handleTouch as EventListener, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouch as EventListener);
    };
  }
}

/**
 * Performance Optimization for Touch
 */
export class TouchPerformance {
  private static rafId: number | null = null;
  private static touchListeners: Array<() => void> = [];

  /**
   * Throttle touch events using requestAnimationFrame
   */
  static throttleTouch<T extends Event>(
    callback: (event: T) => void,
    immediate = false
  ): (event: T) => void {
    let lastCall = 0;

    return (event: T) => {
      const now = Date.now();

      if (immediate || now - lastCall >= 16) { // ~60fps
        lastCall = now;
        if (this.rafId) cancelAnimationFrame(this.rafId);

        this.rafId = requestAnimationFrame(() => {
          callback(event);
        });
      }
    };
  }

  /**
   * Batch touch updates for better performance
   */
  static batchTouchUpdates(callback: () => void): void {
    if (this.rafId) return; // Already scheduled

    this.rafId = requestAnimationFrame(() => {
      callback();
      this.rafId = null;
    });
  }

  /**
   * Memory-efficient touch listener management
   */
  static addTouchListener(cleanup: () => void): void {
    this.touchListeners.push(cleanup);
  }

  static removeAllTouchListeners(): void {
    this.touchListeners.forEach(cleanup => cleanup());
    this.touchListeners = [];
  }
}

/**
 * Device Detection for iOS Optimization
 */
export class DeviceDetector {
  static isIOS(): boolean {
    return /iPhone|iPad|iPod/i.test(navigator.userAgent);
  }

  static isIPhone(): boolean {
    return /iPhone/i.test(navigator.userAgent);
  }

  static getIOSVersion(): number | null {
    const match = navigator.userAgent.match(/OS (\d+)_/);
    return match ? parseInt(match[1], 10) : null;
  }

  static isModernIPhone(): boolean {
    // iPhone 12+ detection (approximate)
    const isIPhone = this.isIPhone();
    const screenHeight = window.screen.height;
    const screenWidth = window.screen.width;

    // iPhone 12-16 screen dimensions (considering device pixel ratio)
    const modernIPhoneHeights = [2556, 2796, 2778, 2532]; // Various iPhone 12-16 models

    return isIPhone && modernIPhoneHeights.some(height =>
      Math.abs(screenHeight - height) < 50 || Math.abs(screenWidth - height) < 50
    );
  }

  static isTouchDevice(): boolean {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }

  static getViewportSafeArea() {
    const safeAreaTop = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--sait') || '0');
    const safeAreaBottom = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--saib') || '0');
    const safeAreaLeft = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--sail') || '0');
    const safeAreaRight = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--sair') || '0');

    return {
      top: safeAreaTop,
      bottom: safeAreaBottom,
      left: safeAreaLeft,
      right: safeAreaRight,
    };
  }
}

/**
 * Touch Animation Utilities
 */
export class TouchAnimations {
  /**
   * Create touch-friendly scale animation
   */
  static createTouchScale(element: HTMLElement, scale = 0.95): () => void {
    let isPressed = false;

    const handleTouchStart = () => {
      if (isPressed) return;
      isPressed = true;
      element.style.transform = `scale(${scale})`;
      element.style.transition = 'transform 0.1s ease-out';
    };

    const handleTouchEnd = () => {
      if (!isPressed) return;
      isPressed = false;
      element.style.transform = 'scale(1)';
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });
    element.addEventListener('touchcancel', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchend', handleTouchEnd);
      element.removeEventListener('touchcancel', handleTouchEnd);
    };
  }

  /**
   * Create touch-friendly glow effect
   */
  static createTouchGlow(element: HTMLElement, color = 'rgba(255, 140, 0, 0.3)'): () => void {
    const originalBoxShadow = element.style.boxShadow;

    const handleTouchStart = () => {
      element.style.boxShadow = `0 0 20px ${color}, ${originalBoxShadow}`;
      element.style.transition = 'box-shadow 0.1s ease-out';
    };

    const handleTouchEnd = () => {
      element.style.boxShadow = originalBoxShadow;
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });
    element.addEventListener('touchcancel', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchend', handleTouchEnd);
      element.removeEventListener('touchcancel', handleTouchEnd);
    };
  }
}

// Export everything for easy imports
export default {
  HapticFeedback,
  TouchTarget,
  GestureRecognizer,
  TouchOptimizer,
  TouchPerformance,
  DeviceDetector,
  TouchAnimations,
};