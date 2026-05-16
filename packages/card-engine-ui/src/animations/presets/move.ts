import type { AnimationDescriptor } from '../types';
import { createAnimationId } from '../types';

export function movePreset(
  targetId: string,
  opts: {
    from: { x: number; y: number };
    to: { x: number; y: number };
    duration?: number;
  }
): AnimationDescriptor {
  return {
    id: createAnimationId(),
    type: 'move',
    target: { type: 'card', cardId: targetId },
    duration: opts.duration ?? 350,
    easing: 'ease-in-out',
    from: { x: opts.from.x, y: opts.from.y },
    to: { x: opts.to.x, y: opts.to.y },
  };
}
