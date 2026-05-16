import type { CardId } from '@card-engine/core';

export interface TransformState {
  x?: number;
  y?: number;
  rotate?: number;
  rotateY?: number;
  scale?: number;
  opacity?: number;
}

export type AnimationTarget =
  | { type: 'card'; cardId: CardId }
  | { type: 'pile'; pileId: string }
  | { type: 'element'; selector: string };

export interface AnimationDescriptor {
  id: string;
  type: 'flip' | 'deal' | 'shuffle' | 'move' | 'custom';
  target: AnimationTarget;
  duration: number;
  easing?: 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'linear';
  from?: TransformState;
  to: TransformState;
  onComplete?: () => void;
}

let animIdCounter = 0;
export function createAnimationId(): string {
  return `anim-${Date.now()}-${animIdCounter++}`;
}
