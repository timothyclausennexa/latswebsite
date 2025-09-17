// Simple stub for touchUtils to prevent import errors

export const DeviceDetector = {
  isTouchDevice: () => 'ontouchstart' in window,
  isIOS: () => /iPhone|iPad|iPod/i.test(navigator.userAgent),
  isModernIPhone: () => /iPhone/.test(navigator.userAgent) && window.screen.width >= 375
};

export const HapticFeedback = {
  trigger: () => {},
  light: () => {},
  medium: () => {},
  heavy: () => {},
  selection: () => {},
  impact: () => {},
  notification: () => {},
  success: () => {},
  error: () => {},
  warning: () => {}
};

export class TouchManager {
  constructor() {}
  onTouchStart() {}
  onTouchMove() {}
  onTouchEnd() {}
  getActiveTouches() { return []; }
  isGesture() { return false; }
  destroy() {}
}

export interface TouchGesture {
  type: string;
  direction?: string;
  distance?: number;
  velocity?: number;
}

export enum SwipeDirection {
  UP = 'up',
  DOWN = 'down',
  LEFT = 'left',
  RIGHT = 'right'
}