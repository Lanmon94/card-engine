import type { Platform } from '../platform';
import type { AnimationDescriptor } from './types';
import { animationToStyle } from './adapters/css';

const FLIP_DURATION = 400;

export function getFlipContainerStyle(
  _platform: Platform,
  _flipped: boolean,
  _duration?: number,
): React.CSSProperties {
  return {
    perspective: '800px',
    WebkitPerspective: '800px',
  };
}

export function getFlipInnerStyle(
  platform: Platform,
  flipped: boolean,
  duration = FLIP_DURATION,
): React.CSSProperties {
  if (platform === 'rn') {
    return {
      transition: `opacity ${duration}ms ease-in-out`,
    };
  }
  return {
    transformStyle: 'preserve-3d' as const,
    WebkitTransformStyle: 'preserve-3d' as const,
    transition: `transform ${duration}ms ease-in-out`,
    transform: `rotateY(${flipped ? 180 : 0}deg)`,
    WebkitTransform: `rotateY(${flipped ? 180 : 0}deg)`,
    width: '100%',
    height: '100%',
    position: 'relative' as const,
  };
}

export function getFlipFaceStyle(platform: Platform): React.CSSProperties {
  if (platform === 'rn') {
    return {
      position: 'absolute' as const,
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
    };
  }
  return {
    backfaceVisibility: 'hidden' as const,
    WebkitBackfaceVisibility: 'hidden' as const,
    position: 'absolute' as const,
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  };
}

export function getFlipBackStyle(platform: Platform): React.CSSProperties {
  if (platform === 'rn') {
    return {
      position: 'absolute' as const,
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
    };
  }
  return {
    backfaceVisibility: 'hidden' as const,
    WebkitBackfaceVisibility: 'hidden' as const,
    position: 'absolute' as const,
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    transform: 'rotateY(180deg)',
    WebkitTransform: 'rotateY(180deg)',
  };
}

export function getEntranceStyle(
  descriptor: AnimationDescriptor,
  phase: 'from' | 'to',
): React.CSSProperties {
  if (phase === 'from') {
    const fromDesc = { ...descriptor, to: descriptor.from ?? {} };
    const style = animationToStyle(fromDesc);
    return {
      transform: style.transform,
      WebkitTransform: style.transform,
      opacity: descriptor.from?.opacity,
      transition: 'none',
    };
  }
  const style = animationToStyle(descriptor);
  return {
    transform: style.transform,
    WebkitTransform: style.transform,
    opacity: descriptor.to.opacity,
    transition: style.transition,
  };
}
