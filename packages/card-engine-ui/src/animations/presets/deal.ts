import type { AnimationDescriptor } from '../types';
import { createAnimationId } from '../types';

export function dealPreset(
  targetId: string,
  opts: {
    from: { x: number; y: number };
    to: { x: number; y: number };
    duration?: number;
  }
): AnimationDescriptor {
  return {
    id: createAnimationId(),
    type: 'deal',
    target: { type: 'card', cardId: targetId },
    duration: opts.duration ?? 300,
    easing: 'ease-out',
    from: { x: opts.from.x, y: opts.from.y, scale: 0.8, opacity: 0 },
    to: { x: opts.to.x, y: opts.to.y, scale: 1, opacity: 1 },
  };
}
