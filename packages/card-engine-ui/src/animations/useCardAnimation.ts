import { useState, useEffect, useRef } from 'react';
import type { AnimationDescriptor } from './types';
import { animationToStyle } from './adapters/css';

export interface UseCardAnimationResult {
  style: React.CSSProperties;
  phase: 'idle' | 'from' | 'to' | 'done';
  isAnimating: boolean;
}

export function useCardAnimation(descriptor: AnimationDescriptor | null): UseCardAnimationResult {
  const [phase, setPhase] = useState<'idle' | 'from' | 'to' | 'done'>('idle');
  const rafRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (!descriptor) {
      setPhase('idle');
      return;
    }

    setPhase('from');

    rafRef.current = requestAnimationFrame(() => {
      setPhase('to');

      timerRef.current = setTimeout(() => {
        setPhase('done');
        descriptor.onComplete?.();
      }, descriptor.duration + 50);
    });

    return () => {
      cancelAnimationFrame(rafRef.current);
      if (timerRef.current !== undefined) clearTimeout(timerRef.current);
    };
  }, [descriptor]);

  const style = computeStyle(descriptor, phase);

  return {
    style,
    phase,
    isAnimating: phase === 'from' || phase === 'to',
  };
}

function computeStyle(
  descriptor: AnimationDescriptor | null,
  phase: 'idle' | 'from' | 'to' | 'done',
): React.CSSProperties {
  if (!descriptor || phase === 'idle' || phase === 'done') {
    return {};
  }

  if (phase === 'from') {
    const fromDesc = { ...descriptor, to: descriptor.from ?? {} };
    const animStyle = animationToStyle(fromDesc);
    return {
      transform: animStyle.transform,
      opacity: descriptor.from?.opacity,
      transition: 'none',
    };
  }

  const animStyle = animationToStyle(descriptor);
  return {
    transform: animStyle.transform,
    opacity: descriptor.to.opacity,
    transition: animStyle.transition,
  };
}

export { animationToStyle };
