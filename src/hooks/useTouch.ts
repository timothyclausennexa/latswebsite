/**
 * React hook for enhanced touch interactions
 * Optimized for iPhone 12-16 with haptic feedback, gesture recognition, and performance optimization
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import {
  HapticFeedback,
  TouchOptimizer,
  TouchAnimations,
  GestureRecognizer,
  DeviceDetector,
  TouchPerformance,
  type SwipeGesture,
  type HapticType
} from '../utils/touchUtils';

export interface UseTouchOptions {
  // Haptic feedback
  enableHaptics?: boolean;
  hapticOnPress?: HapticType;
  hapticOnRelease?: HapticType;

  // Visual feedback
  enableRipple?: boolean;
  rippleColor?: string;
  enableScale?: boolean;
  scaleAmount?: number;
  enableGlow?: boolean;
  glowColor?: string;

  // Gestures
  enableSwipe?: boolean;
  enableLongPress?: boolean;
  longPressDuration?: number;

  // Touch optimization
  preventDefaults?: boolean;
  optimizePerformance?: boolean;
  ensureMinTouchTarget?: boolean;

  // Callbacks
  onPress?: (event: TouchEvent) => void;
  onRelease?: (event: TouchEvent) => void;
  onSwipe?: (gesture: SwipeGesture) => void;
  onLongPress?: (event: TouchEvent) => void;
  onTap?: (event: TouchEvent) => void;
}

export interface TouchState {
  isPressed: boolean;
  isLongPressed: boolean;
  lastSwipeGesture: SwipeGesture | null;
  touchCount: number;
}

/**
 * Enhanced touch hook for React components
 */
export function useTouch(options: UseTouchOptions = {}) {
  const {
    enableHaptics = true,
    hapticOnPress = 'impactLight',
    hapticOnRelease = 'selection',
    enableRipple = true,
    rippleColor = 'rgba(255, 140, 0, 0.3)',
    enableScale = true,
    scaleAmount = 0.95,
    enableGlow = false,
    glowColor = 'rgba(255, 140, 0, 0.3)',
    enableSwipe = false,
    enableLongPress = false,
    longPressDuration = 500,
    preventDefaults = true,
    optimizePerformance = true,
    ensureMinTouchTarget = true,
    onPress,
    onRelease,
    onSwipe,
    onLongPress,
    onTap,
  } = options;

  const elementRef = useRef<HTMLElement>(null);
  const gestureRecognizer = useRef(new GestureRecognizer());
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const cleanupFunctions = useRef<Array<() => void>>([]);

  const [touchState, setTouchState] = useState<TouchState>({
    isPressed: false,
    isLongPressed: false,
    lastSwipeGesture: null,
    touchCount: 0,
  });

  // Optimized touch handlers
  const handleTouchStart = useCallback(
    TouchPerformance.throttleTouch((event: TouchEvent) => {
      if (!elementRef.current) return;

      const touchCount = event.touches.length;

      setTouchState(prev => ({
        ...prev,
        isPressed: true,
        touchCount,
      }));

      // Haptic feedback
      if (enableHaptics && DeviceDetector.isTouchDevice()) {
        HapticFeedback.trigger(hapticOnPress);
      }

      // Gesture recognition
      if (enableSwipe) {
        gestureRecognizer.current.handleTouchStart(event);
      }

      // Long press detection
      if (enableLongPress) {
        longPressTimer.current = setTimeout(() => {
          setTouchState(prev => ({ ...prev, isLongPressed: true }));
          if (enableHaptics) {
            HapticFeedback.trigger('impactMedium');
          }
          onLongPress?.(event);
        }, longPressDuration);
      }

      onPress?.(event);
    }),
    [enableHaptics, enableSwipe, enableLongPress, hapticOnPress, longPressDuration, onPress, onLongPress]
  );

  const handleTouchMove = useCallback(
    TouchPerformance.throttleTouch((event: TouchEvent) => {
      if (enableSwipe) {
        gestureRecognizer.current.handleTouchMove(event);
      }

      // Cancel long press if finger moves too much
      if (longPressTimer.current && enableLongPress) {
        // Simple movement detection - you might want to make this more sophisticated
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
    }),
    [enableSwipe, enableLongPress]
  );

  const handleTouchEnd = useCallback(
    TouchPerformance.throttleTouch((event: TouchEvent) => {
      const wasPressed = touchState.isPressed;
      const wasLongPressed = touchState.isLongPressed;

      setTouchState(prev => ({
        ...prev,
        isPressed: false,
        isLongPressed: false,
        touchCount: 0,
      }));

      // Clear long press timer
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }

      // Haptic feedback
      if (enableHaptics && wasPressed && DeviceDetector.isTouchDevice()) {
        HapticFeedback.trigger(hapticOnRelease);
      }

      // Gesture recognition
      if (enableSwipe) {
        const swipeGesture = gestureRecognizer.current.handleTouchEnd(event);
        if (swipeGesture) {
          setTouchState(prev => ({ ...prev, lastSwipeGesture: swipeGesture }));
          onSwipe?.(swipeGesture);
        }
      }

      // Tap detection (if not a long press)
      if (wasPressed && !wasLongPressed) {
        onTap?.(event);
      }

      onRelease?.(event);
    }),
    [enableHaptics, enableSwipe, hapticOnRelease, touchState.isPressed, touchState.isLongPressed, onRelease, onSwipe, onTap]
  );

  const handleTouchCancel = useCallback(() => {
    setTouchState(prev => ({
      ...prev,
      isPressed: false,
      isLongPressed: false,
      touchCount: 0,
    }));

    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  // Setup touch optimizations
  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Clear previous cleanup functions
    cleanupFunctions.current.forEach(cleanup => cleanup());
    cleanupFunctions.current = [];

    // Touch optimization
    if (optimizePerformance) {
      TouchOptimizer.optimizeForTouch(element);
    }

    // Prevent default behaviors
    if (preventDefaults) {
      const preventDefaultsCleanup = TouchOptimizer.preventDefaults(element);
      cleanupFunctions.current.push(preventDefaultsCleanup);
    }

    // Visual feedback effects
    if (enableRipple) {
      const rippleCleanup = TouchOptimizer.addRippleEffect(element, rippleColor);
      cleanupFunctions.current.push(rippleCleanup);
    }

    if (enableScale) {
      const scaleCleanup = TouchAnimations.createTouchScale(element, scaleAmount);
      cleanupFunctions.current.push(scaleCleanup);
    }

    if (enableGlow) {
      const glowCleanup = TouchAnimations.createTouchGlow(element, glowColor);
      cleanupFunctions.current.push(glowCleanup);
    }

    // Touch event listeners
    const touchStartHandler = handleTouchStart as EventListener;
    const touchMoveHandler = handleTouchMove as EventListener;
    const touchEndHandler = handleTouchEnd as EventListener;
    const touchCancelHandler = handleTouchCancel as EventListener;

    element.addEventListener('touchstart', touchStartHandler, { passive: !preventDefaults });
    element.addEventListener('touchmove', touchMoveHandler, { passive: !preventDefaults });
    element.addEventListener('touchend', touchEndHandler, { passive: !preventDefaults });
    element.addEventListener('touchcancel', touchCancelHandler, { passive: true });

    // Cleanup function for event listeners
    const eventListenerCleanup = () => {
      element.removeEventListener('touchstart', touchStartHandler);
      element.removeEventListener('touchmove', touchMoveHandler);
      element.removeEventListener('touchend', touchEndHandler);
      element.removeEventListener('touchcancel', touchCancelHandler);
    };

    cleanupFunctions.current.push(eventListenerCleanup);

    return () => {
      cleanupFunctions.current.forEach(cleanup => cleanup());
      cleanupFunctions.current = [];
    };
  }, [
    enableRipple,
    rippleColor,
    enableScale,
    scaleAmount,
    enableGlow,
    glowColor,
    preventDefaults,
    optimizePerformance,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleTouchCancel,
  ]);

  // Ensure minimum touch target size
  useEffect(() => {
    const element = elementRef.current;
    if (!element || !ensureMinTouchTarget) return;

    // Use ResizeObserver to monitor size changes
    const resizeObserver = new ResizeObserver(() => {
      // Only enforce minimum size if we're on a touch device
      if (DeviceDetector.isTouchDevice()) {
        // Add CSS classes to ensure minimum touch target
        element.classList.add('touch-target-min');
      }
    });

    resizeObserver.observe(element);

    return () => {
      resizeObserver.disconnect();
    };
  }, [ensureMinTouchTarget]);

  return {
    ref: elementRef,
    touchState,
    // Utility functions
    triggerHaptic: (type: HapticType) => {
      if (enableHaptics) {
        HapticFeedback.trigger(type);
      }
    },
    isTouch: DeviceDetector.isTouchDevice(),
    isIOS: DeviceDetector.isIOS(),
    isModernIPhone: DeviceDetector.isModernIPhone(),
  };
}

/**
 * Specialized hook for buttons with optimal touch settings
 */
export function useTouchButton(options: Partial<UseTouchOptions> = {}) {
  return useTouch({
    enableHaptics: true,
    hapticOnPress: 'impactLight',
    hapticOnRelease: 'selection',
    enableRipple: true,
    enableScale: true,
    scaleAmount: 0.95,
    preventDefaults: false, // Allow normal button behavior
    optimizePerformance: true,
    ensureMinTouchTarget: true,
    ...options,
  });
}

/**
 * Specialized hook for cards/interactive elements
 */
export function useTouchCard(options: Partial<UseTouchOptions> = {}) {
  return useTouch({
    enableHaptics: true,
    hapticOnPress: 'impactLight',
    enableRipple: true,
    enableScale: true,
    scaleAmount: 0.98,
    enableSwipe: true,
    preventDefaults: true,
    optimizePerformance: true,
    ensureMinTouchTarget: true,
    ...options,
  });
}

/**
 * Specialized hook for game elements
 */
export function useTouchGame(options: Partial<UseTouchOptions> = {}) {
  return useTouch({
    enableHaptics: true,
    hapticOnPress: 'impactMedium',
    hapticOnRelease: 'impactLight',
    enableRipple: false, // Games usually handle their own effects
    enableScale: false,
    enableSwipe: true,
    enableLongPress: true,
    preventDefaults: true,
    optimizePerformance: true,
    ensureMinTouchTarget: false, // Games handle their own touch targets
    ...options,
  });
}

/**
 * Hook for scroll containers with touch optimization
 */
export function useTouchScroll(options: Partial<UseTouchOptions> = {}) {
  const { ref } = useTouch({
    enableHaptics: false, // Don't interfere with scrolling
    enableRipple: false,
    enableScale: false,
    preventDefaults: false, // Allow native scrolling
    optimizePerformance: true,
    ensureMinTouchTarget: false,
    ...options,
  });

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // Enable smooth scrolling
    TouchOptimizer.enableSmoothScroll(element);
  }, [ref]);

  return { ref };
}