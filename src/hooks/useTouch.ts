// Simple stub for useTouch hooks to prevent import errors
import { useRef } from 'react';

const createStubHook = () => {
  const ref = useRef(null);
  return {
    ref,
    triggerHaptic: () => {}
  };
};

export const useTouch = () => createStubHook();
export const useTouchButton = () => createStubHook();
export const useTouchCard = () => createStubHook();
export const useTouchGame = () => createStubHook();
export const useTouchScroll = () => createStubHook();

export default useTouch;