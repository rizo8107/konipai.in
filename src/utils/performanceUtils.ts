/**
 * Performance utilities for React components and general app optimization
 */
import React from 'react';

/**
 * Debounce function to limit the rate at which a function can fire
 * @param fn - The function to debounce
 * @param delay - Delay in milliseconds
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  
  return function(...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    timeoutId = setTimeout(() => {
      fn(...args);
    }, delay);
  };
}

/**
 * Throttle function to ensure a function is called at most once in a specified time period
 * @param fn - The function to throttle
 * @param limit - Time limit in milliseconds
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  
  return function(...args: Parameters<T>) {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * Creates a memoized selector that only recalculates when inputs change
 * A simple implementation of memoization for derived state
 * @param selector - Function that derives state
 */
export function createSelector<TInput, TOutput>(
  selector: (input: TInput) => TOutput
): (input: TInput) => TOutput {
  let lastInput: TInput | undefined;
  let lastOutput: TOutput | undefined;
  
  return (input: TInput) => {
    if (input !== lastInput) {
      lastInput = input;
      lastOutput = selector(input);
    }
    
    return lastOutput as TOutput;
  };
}

/**
 * Checks if two objects are shallowly equal (first level only)
 * Useful for React.memo comparisons
 */
export function shallowEqual(obj1: any, obj2: any): boolean {
  if (obj1 === obj2) {
    return true;
  }
  
  if (
    typeof obj1 !== 'object' ||
    typeof obj2 !== 'object' ||
    obj1 === null ||
    obj2 === null
  ) {
    return false;
  }
  
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);
  
  if (keys1.length !== keys2.length) {
    return false;
  }
  
  for (const key of keys1) {
    if (obj1[key] !== obj2[key]) {
      return false;
    }
  }
  
  return true;
}

/**
 * Measure component render time - for development only
 * Usage: const Timer = withRenderTimer(YourComponent, 'ComponentName');
 */
export function withRenderTimer<P extends object>(
  Component: React.ComponentType<P>,
  componentName: string
): React.FC<P> {
  return (props: P) => {
    const startTime = performance.now();
    const result = React.createElement(Component, props);
    const endTime = performance.now();
    
    console.log(`[Render Timer] ${componentName}: ${(endTime - startTime).toFixed(2)}ms`);
    
    return result;
  };
} 