// Components
export { Card } from './components/Card/Card';
export type { CardProps } from './components/Card/Card';
export { HandView } from './components/HandView/HandView';
export type { HandViewProps } from './components/HandView/HandView';
export { PileView } from './components/PileView/PileView';
export type { PileViewProps } from './components/PileView/PileView';
export { SpreadView } from './components/SpreadView/SpreadView';
export type { SpreadViewProps } from './components/SpreadView/SpreadView';
export { CardEngine, CardEngineContext, useCardEngine } from './components/CardEngine/CardEngine';
export type { CardEngineProps, CardEngineConfig } from './components/CardEngine/CardEngine';

// Canvas-based components
export { CanvasShuffle } from './components/CanvasShuffle/CanvasShuffle';
export type { CanvasShuffleProps } from './components/CanvasShuffle/CanvasShuffle';
export { CanvasRiffleShuffle } from './components/CanvasRiffleShuffle/CanvasRiffleShuffle';
export type { CanvasRiffleShuffleProps } from './components/CanvasRiffleShuffle/CanvasRiffleShuffle';

// Animation
export type { AnimationDescriptor, AnimationTarget, TransformState } from './animations/types';
export { useCardAnimation } from './animations/useCardAnimation';
export type { UseCardAnimationResult } from './animations/useCardAnimation';
export { flipPreset } from './animations/presets/flip';
export { dealPreset } from './animations/presets/deal';
export { shufflePreset } from './animations/presets/shuffle';
export { movePreset } from './animations/presets/move';
export {
  getFlipContainerStyle,
  getFlipInnerStyle,
  getFlipFaceStyle,
  getFlipBackStyle,
  getEntranceStyle,
} from './animations/utils';

// Hooks
export { usePlatform } from './hooks/usePlatform';

// Platform
export { getPlatform } from './platform';
export type { Platform } from './platform';

// Re-export core types for convenience
export type { Card as CardData, CardId, CardFace, Rank, Suit, Hand, Pile, PileType, GameState, GameAction } from '@card-engine/core';
