import type { AnimationDescriptor, TransformState } from '../types';

export interface CSSAnimationStyle {
  transform: string;
  opacity?: number;
  transition: string;
  transformOrigin?: string;
  willChange: string;
}

const DEFAULT_EASING = 'ease-out';

function buildTransform(from: TransformState | undefined, to: TransformState): string {
  const parts: string[] = [];

  // Translation — emit when x/y are explicitly set (even to 0) so CSS can interpolate
  if (to.x !== undefined || to.y !== undefined) {
    parts.push(`translate(${to.x ?? 0}px, ${to.y ?? 0}px)`);
  }

  // 2D rotation
  if (to.rotate !== undefined && to.rotate !== 0) {
    parts.push(`rotate(${to.rotate}deg)`);
  }

  // 3D rotation (card flip)
  if (to.rotateY !== undefined && to.rotateY !== 0) {
    parts.push(`rotateY(${to.rotateY}deg)`);
  }

  // Scale
  if (to.scale !== undefined && to.scale !== 1) {
    parts.push(`scale(${to.scale})`);
  }

  return parts.length > 0 ? parts.join(' ') : 'none';
}

export function animationToStyle(descriptor: AnimationDescriptor): CSSAnimationStyle {
  const duration = `${descriptor.duration}ms`;
  const easing = descriptor.easing ?? DEFAULT_EASING;
  const transform = buildTransform(descriptor.from, descriptor.to);

  return {
    transform,
    opacity: descriptor.to.opacity,
    transition: `transform ${duration} ${easing}, opacity ${duration} ${easing}`,
    transformOrigin: descriptor.to.rotateY !== undefined ? 'center center' : 'center center',
    willChange: 'transform, opacity',
  };
}

export function animationToCSSProperties(descriptor: AnimationDescriptor): Record<string, string> {
  const style = animationToStyle(descriptor);
  return {
    '--anim-transform': style.transform,
    '--anim-opacity': style.opacity !== undefined ? String(style.opacity) : '1',
    '--anim-duration': `${descriptor.duration}ms`,
    '--anim-easing': descriptor.easing ?? DEFAULT_EASING,
  };
}

export function applyCSSAnimation(element: HTMLElement, descriptor: AnimationDescriptor): () => void {
  const style = animationToStyle(descriptor);

  element.style.transition = style.transition;
  element.style.transform = style.transform;
  element.style.willChange = style.willChange;

  if (style.opacity !== undefined) {
    element.style.opacity = String(style.opacity);
  }

  const duration = descriptor.duration;

  const timer = setTimeout(() => {
    element.style.transition = '';
    element.style.willChange = '';
    descriptor.onComplete?.();
  }, duration);

  return () => {
    clearTimeout(timer);
    element.style.transition = '';
    element.style.willChange = '';
  };
}
