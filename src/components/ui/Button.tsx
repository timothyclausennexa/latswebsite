import React from 'react';
// FIX: Import IconType directly from the types file instead of from the Icon component.
import { Icon } from './Icon';
import type { IconType } from '../../types';
import { useTouchButton } from '../../hooks/useTouch';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  icon?: IconType;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  tooltip?: string;
  enableHaptics?: boolean;
  touchFeedback?: 'light' | 'medium' | 'heavy';
  rippleColor?: string;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  icon,
  disabled,
  className,
  tooltip,
  enableHaptics = true,
  touchFeedback = 'light',
  rippleColor,
  onClick,
  ...props
}) => {
  // Touch optimization with haptic feedback
  const touchHapticType = touchFeedback === 'heavy' ? 'impactHeavy' :
                          touchFeedback === 'medium' ? 'impactMedium' : 'impactLight';

  const defaultRippleColor = variant === 'primary' ? 'rgba(158, 48, 57, 0.3)' :
                            variant === 'secondary' ? 'rgba(255, 138, 0, 0.3)' :
                            'rgba(229, 229, 229, 0.3)';

  const { ref, triggerHaptic } = useTouchButton({
    enableHaptics,
    hapticOnPress: touchHapticType,
    hapticOnRelease: 'selection',
    enableRipple: true,
    rippleColor: rippleColor || defaultRippleColor,
    enableScale: true,
    scaleAmount: 0.95,
    onTap: (event: TouchEvent) => {
      if (onClick && !disabled) {
        const syntheticEvent = {
          ...event,
          currentTarget: ref.current,
          target: ref.current,
          preventDefault: () => event.preventDefault(),
          stopPropagation: () => event.stopPropagation(),
        } as unknown as React.MouseEvent<HTMLButtonElement>;
        onClick(syntheticEvent);
      }
    },
  });

  const baseClasses = `
    group relative font-pixel-heading border-2 border-prison-black shadow-pixel-md
    hover:translate-y-[-2px] hover:scale-[1.02] hover-to-touch
    active:translate-y-[2px] active:scale-[0.98] active:shadow-pixel-sm
    transition-transform duration-150 touch-manipulation min-h-[44px] flex items-center justify-center
    focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-prison-black focus-visible:ring-warning-orange
    touch-optimized touch-focus touch-ripple touch-target-min
  `;

  const variantClasses = {
    primary: 'bg-alarm-red text-prison-black',
    secondary: 'bg-warning-orange text-prison-black',
    ghost: 'bg-transparent border-ash-white/50 text-ash-white/50',
  };

  const sizeClasses = {
    sm: 'px-3 py-2 text-xs sm:text-sm',
    md: 'px-4 py-3 text-sm sm:text-base',
    lg: 'px-5 py-3 text-sm sm:px-6 sm:py-4 sm:text-base lg:text-lg',
  };

  const iconSizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  const disabledClasses = "disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none disabled:border-gray-700 disabled:touch-none";

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;

    // Trigger haptic feedback for non-touch interactions
    if (enableHaptics) {
      triggerHaptic(touchHapticType);
    }

    if (onClick) {
      onClick(event);
    }
  };

  return (
    <div className="relative inline-block">
      <button
        ref={ref}
        className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${disabled ? disabledClasses : ''} ${className || ''}`}
        disabled={disabled}
        onClick={handleClick}
        {...props}
      >
        <div className="flex items-center justify-center gap-2">
          {icon && <Icon type={icon} className={iconSizeClasses[size]} />}
          <span>{children}</span>
        </div>
      </button>
      {disabled && tooltip && (
        <div className="absolute bottom-full left-1/2 mb-2 w-max -translate-x-1/2 transform opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity duration-200 bg-prison-black text-ash-white text-xs px-2 py-1 border border-ash-white/30 font-body touch-only">
          {tooltip}
        </div>
      )}
    </div>
  );
};
