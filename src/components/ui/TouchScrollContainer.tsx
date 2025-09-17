/**
 * Touch-optimized scroll container with gesture support
 * Designed for iPhone 12-16 with enhanced scrolling performance
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useTouchScroll } from '../../hooks/useTouch';
import { DeviceDetector, HapticFeedback } from '../../utils/touchUtils';

interface TouchScrollContainerProps {
  children: React.ReactNode;
  className?: string;
  height?: string;
  maxHeight?: string;
  enableMomentum?: boolean;
  enableSnapScrolling?: boolean;
  snapThreshold?: number;
  enablePullToRefresh?: boolean;
  onRefresh?: () => Promise<void>;
  enableScrollIndicator?: boolean;
  scrollIndicatorColor?: string;
  horizontalScroll?: boolean;
  enableInfiniteScroll?: boolean;
  onLoadMore?: () => Promise<void>;
  loadMoreThreshold?: number;
  enableHapticFeedback?: boolean;
}

export const TouchScrollContainer: React.FC<TouchScrollContainerProps> = ({
  children,
  className = '',
  height = 'auto',
  maxHeight = '100%',
  enableMomentum = true,
  enableSnapScrolling = false,
  snapThreshold = 50,
  enablePullToRefresh = false,
  onRefresh,
  enableScrollIndicator = true,
  scrollIndicatorColor = '#FF8A00',
  horizontalScroll = false,
  enableInfiniteScroll = false,
  onLoadMore,
  loadMoreThreshold = 100,
  enableHapticFeedback = true,
}) => {
  const { ref } = useTouchScroll();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showScrollIndicator, setShowScrollIndicator] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Pull to refresh state
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const pullStartY = useRef(0);
  const maxPullDistance = 80;

  // Combine refs
  const combinedRef = useCallback((node: HTMLDivElement) => {
    if (ref.current !== node) {
      (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
    }
    containerRef.current = node;
  }, [ref]);

  // Enhanced scroll handling with haptic feedback
  const handleScroll = useCallback((e: Event) => {
    const target = e.target as HTMLDivElement;
    if (!target) return;

    const { scrollTop, scrollHeight, clientHeight, scrollLeft, scrollWidth, clientWidth } = target;

    // Calculate scroll progress
    if (horizontalScroll) {
      const maxScroll = scrollWidth - clientWidth;
      const progress = maxScroll > 0 ? scrollLeft / maxScroll : 0;
      setScrollProgress(progress);
    } else {
      const maxScroll = scrollHeight - clientHeight;
      const progress = maxScroll > 0 ? scrollTop / maxScroll : 0;
      setScrollProgress(progress);
    }

    // Show/hide scroll indicator
    const hasScroll = horizontalScroll
      ? scrollWidth > clientWidth
      : scrollHeight > clientHeight;

    setShowScrollIndicator(hasScroll && scrollProgress > 0 && scrollProgress < 1);

    // Infinite scroll detection
    if (enableInfiniteScroll && onLoadMore && !isLoadingMore) {
      const distanceFromBottom = horizontalScroll
        ? scrollWidth - scrollLeft - clientWidth
        : scrollHeight - scrollTop - clientHeight;

      if (distanceFromBottom <= loadMoreThreshold) {
        setIsLoadingMore(true);
        onLoadMore().finally(() => setIsLoadingMore(false));

        if (enableHapticFeedback && DeviceDetector.isTouchDevice()) {
          HapticFeedback.trigger('impactLight');
        }
      }
    }

    // Haptic feedback at scroll boundaries
    if (enableHapticFeedback && DeviceDetector.isTouchDevice()) {
      if (scrollProgress === 0 || scrollProgress === 1) {
        HapticFeedback.trigger('impactLight');
      }
    }
  }, [horizontalScroll, enableInfiniteScroll, onLoadMore, isLoadingMore, loadMoreThreshold, enableHapticFeedback, scrollProgress]);

  // Pull to refresh handling
  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!enablePullToRefresh || !containerRef.current) return;

    const touch = e.touches[0];
    pullStartY.current = touch.clientY;

    // Only start pull if scrolled to top
    if (containerRef.current.scrollTop === 0) {
      setIsPulling(true);
    }
  }, [enablePullToRefresh]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isPulling || !enablePullToRefresh) return;

    const touch = e.touches[0];
    const deltaY = touch.clientY - pullStartY.current;

    if (deltaY > 0 && deltaY <= maxPullDistance) {
      setPullDistance(deltaY);
      e.preventDefault();
    }
  }, [isPulling, enablePullToRefresh, maxPullDistance]);

  const handleTouchEnd = useCallback(() => {
    if (!isPulling || !enablePullToRefresh) return;

    setIsPulling(false);

    if (pullDistance >= snapThreshold && onRefresh && !isRefreshing) {
      setIsRefreshing(true);
      if (enableHapticFeedback && DeviceDetector.isTouchDevice()) {
        HapticFeedback.trigger('impactMedium');
      }

      onRefresh().finally(() => {
        setIsRefreshing(false);
        setPullDistance(0);
      });
    } else {
      setPullDistance(0);
    }
  }, [isPulling, enablePullToRefresh, pullDistance, snapThreshold, onRefresh, isRefreshing, enableHapticFeedback]);

  // Snap scrolling
  const handleScrollEnd = useCallback(() => {
    if (!enableSnapScrolling || !containerRef.current) return;

    const container = containerRef.current;
    const { scrollTop, clientHeight, scrollLeft, clientWidth } = container;

    if (horizontalScroll) {
      const snapPoint = Math.round(scrollLeft / clientWidth) * clientWidth;
      container.scrollTo({ left: snapPoint, behavior: 'smooth' });
    } else {
      const snapPoint = Math.round(scrollTop / clientHeight) * clientHeight;
      container.scrollTo({ top: snapPoint, behavior: 'smooth' });
    }

    if (enableHapticFeedback && DeviceDetector.isTouchDevice()) {
      HapticFeedback.trigger('selection');
    }
  }, [enableSnapScrolling, horizontalScroll, enableHapticFeedback]);

  // Setup scroll listeners and optimizations
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Add scroll listener with throttling
    let scrollTimeout: NodeJS.Timeout;
    const throttledScrollEnd = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(handleScrollEnd, 150);
    };

    const scrollHandler = (e: Event) => {
      handleScroll(e);
      throttledScrollEnd();
    };

    container.addEventListener('scroll', scrollHandler, { passive: true });

    // Touch event listeners for pull to refresh
    if (enablePullToRefresh) {
      container.addEventListener('touchstart', handleTouchStart, { passive: true });
      container.addEventListener('touchmove', handleTouchMove, { passive: false });
      container.addEventListener('touchend', handleTouchEnd, { passive: true });
    }

    return () => {
      container.removeEventListener('scroll', scrollHandler);
      if (enablePullToRefresh) {
        container.removeEventListener('touchstart', handleTouchStart);
        container.removeEventListener('touchmove', handleTouchMove);
        container.removeEventListener('touchend', handleTouchEnd);
      }
      clearTimeout(scrollTimeout);
    };
  }, [enablePullToRefresh, handleScroll, handleScrollEnd, handleTouchStart, handleTouchMove, handleTouchEnd]);

  // Optimize scroll performance
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Enable hardware acceleration and smooth scrolling
    container.style.transform = 'translateZ(0)';
    container.style.willChange = 'scroll-position';

    if (DeviceDetector.isIOS()) {
      container.style.webkitOverflowScrolling = 'touch';
    }

    // Set scroll direction
    if (horizontalScroll) {
      container.style.overflowX = 'auto';
      container.style.overflowY = 'hidden';
    } else {
      container.style.overflowX = 'hidden';
      container.style.overflowY = 'auto';
    }

    // Enable momentum scrolling
    if (enableMomentum) {
      container.style.scrollBehavior = 'smooth';
    }

    return () => {
      container.style.willChange = 'auto';
    };
  }, [horizontalScroll, enableMomentum]);

  const scrollContainerClasses = `
    relative
    ${horizontalScroll ? 'overflow-x-auto overflow-y-hidden' : 'overflow-y-auto overflow-x-hidden'}
    ${enableMomentum ? 'touch-scroll-momentum' : 'touch-scroll'}
    ${DeviceDetector.isIOS() ? 'ios-scroll ios-no-bounce' : ''}
    touch-optimized
    custom-scrollbar
    ${className}
  `;

  const pullToRefreshIndicator = enablePullToRefresh && (isPulling || isRefreshing) && (
    <div
      className="absolute top-0 left-0 right-0 flex items-center justify-center bg-prison-black/90 backdrop-blur-sm border-b border-ash-white/20 transition-all duration-200 z-10"
      style={{
        height: `${Math.max(pullDistance, isRefreshing ? 60 : 0)}px`,
        transform: `translateY(${isRefreshing ? 0 : -60 + pullDistance}px)`
      }}
    >
      <div className="flex items-center gap-2 text-ash-white">
        {isRefreshing ? (
          <>
            <div className="w-4 h-4 border-2 border-warning-orange border-t-transparent rounded-full animate-spin" />
            <span className="font-pixel-heading text-sm">Refreshing...</span>
          </>
        ) : (
          <>
            <div className="w-4 h-4 text-warning-orange">↓</div>
            <span className="font-pixel-heading text-sm">
              {pullDistance >= snapThreshold ? 'Release to refresh' : 'Pull to refresh'}
            </span>
          </>
        )}
      </div>
    </div>
  );

  const scrollIndicator = enableScrollIndicator && showScrollIndicator && (
    <div
      className={`fixed z-20 bg-prison-black/80 backdrop-blur-sm rounded-full transition-opacity duration-200 ${
        horizontalScroll ? 'bottom-4 left-1/2 transform -translate-x-1/2 h-2 w-16' : 'right-4 top-1/2 transform -translate-y-1/2 w-2 h-16'
      }`}
    >
      <div
        className="rounded-full transition-all duration-100 ease-out"
        style={{
          backgroundColor: scrollIndicatorColor,
          [horizontalScroll ? 'width' : 'height']: `${scrollProgress * 100}%`,
          [horizontalScroll ? 'height' : 'width']: '100%'
        }}
      />
    </div>
  );

  const infiniteScrollIndicator = enableInfiniteScroll && isLoadingMore && (
    <div className="flex items-center justify-center p-4 text-ash-white">
      <div className="w-6 h-6 border-2 border-warning-orange border-t-transparent rounded-full animate-spin mr-2" />
      <span className="font-pixel-heading text-sm">Loading more...</span>
    </div>
  );

  return (
    <div className="relative">
      {pullToRefreshIndicator}
      <div
        ref={combinedRef}
        className={scrollContainerClasses}
        style={{
          height,
          maxHeight,
          paddingTop: enablePullToRefresh && (isPulling || isRefreshing) ? `${Math.max(pullDistance, isRefreshing ? 60 : 0)}px` : undefined
        }}
      >
        {children}
        {infiniteScrollIndicator}
      </div>
      {scrollIndicator}
    </div>
  );
};

export default TouchScrollContainer;