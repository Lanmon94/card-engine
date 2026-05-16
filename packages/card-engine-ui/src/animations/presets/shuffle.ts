import type { AnimationDescriptor } from '../types';
import { createAnimationId } from '../types';

export function shufflePreset(
  targetId: string,
  opts?: { duration?: number }
): AnimationDescriptor {
  return {
    id: createAnimationId(),
    type: 'shuffle',
    target: { type: 'pile', pileId: targetId },
    duration: opts?.duration ?? 500,
    easing: 'ease-in-out',
    to: { x: 3, rotate: 3, scale: 0.95 },
  };
}
