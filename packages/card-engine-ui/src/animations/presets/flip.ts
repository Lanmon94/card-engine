import type { AnimationDescriptor } from '../types';
import { createAnimationId } from '../types';

export function flipPreset(
  targetId: string,
  targetType: 'card' | 'element',
  opts?: { duration?: number; fromFaceDown?: boolean }
): AnimationDescriptor {
  const duration = opts?.duration ?? 400;
  const fromDown = opts?.fromFaceDown ?? true;

  return {
    id: createAnimationId(),
    type: 'flip',
    target: targetType === 'card'
      ? { type: 'card', cardId: targetId }
      : { type: 'element', selector: targetId },
    duration,
    easing: 'ease-in-out',
    from: { rotateY: fromDown ? 0 : 180 },
    to: { rotateY: fromDown ? 180 : 0 },
  };
}
