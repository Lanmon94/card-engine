import React, { createContext, useContext } from 'react';
import type { GameState, GameAction, Card as CardData } from '@card-engine/core';
import { GamePhase } from '@card-engine/core';
import type { CardProps } from '../Card/Card';

export interface CardEngineConfig {
  size?: CardProps['size'];
  rounded?: boolean;
  shadow?: boolean;
  renderFace?: (card: CardData) => React.ReactNode;
  renderBack?: () => React.ReactNode;
  cardBackImage?: string;
  drawBack?: (ctx: CanvasRenderingContext2D, w: number, h: number) => void;
}

export interface CardEngineProps {
  state: GameState;
  dispatch?: (action: GameAction) => void;
  config?: CardEngineConfig;
  children: React.ReactNode;
}

const defaultConfig: CardEngineConfig = {
  size: 'md',
  rounded: true,
  shadow: true,
};

export const CardEngineContext = createContext<{
  config: CardEngineConfig;
  state: GameState;
  dispatch?: (action: GameAction) => void;
}>({
  config: defaultConfig,
  state: { zones: {}, phase: GamePhase.Setup, turn: 0, history: [] },
});

export function useCardEngine() {
  return useContext(CardEngineContext);
}

export const CardEngine: React.FC<CardEngineProps> = ({
  state,
  dispatch,
  config = defaultConfig,
  children,
}) => {
  const mergedConfig: CardEngineConfig = { ...defaultConfig, ...config };

  return (
    <CardEngineContext.Provider value={{ config: mergedConfig, state, dispatch }}>
      {children}
    </CardEngineContext.Provider>
  );
};

CardEngine.displayName = 'CardEngine';
