import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { View } from '@tarojs/components';
import type { Card as CardData, CardFace } from '@card-engine/core';
import { CardFace as Face } from '@card-engine/core';
import { CardFace as DefaultCardFace } from './CardFace';
import { CardBack as DefaultCardBack } from './CardBack';
import { usePlatform } from '../../hooks/usePlatform';
import { useCardAnimation } from '../../animations/useCardAnimation';
import { dealPreset } from '../../animations/presets/deal';
import {
  getFlipContainerStyle,
  getFlipInnerStyle,
  getFlipFaceStyle,
  getFlipBackStyle,
} from '../../animations/utils';

type CardSize = 'sm' | 'md' | 'lg';

const SIZE_MAP: Record<CardSize, { width: number; height: number }> = {
  sm:  { width: 60,  height: 84 },
  md:  { width: 80,  height: 112 },
  lg:  { width: 110, height: 154 },
};

export interface CardProps {
  card: CardData;
  size?: CardSize | { width: number; height: number };
  rounded?: boolean;
  shadow?: boolean;
  disabled?: boolean;
  selected?: boolean;
  flipOnTap?: boolean;
  flipDuration?: number;
  animateIn?: 'deal' | 'none';
  onTap?: (card: CardData) => void;
  onLongPress?: (card: CardData) => void;
  className?: string;
  style?: React.CSSProperties;
  renderFace?: (card: CardData) => React.ReactNode;
  renderBack?: () => React.ReactNode;
  renderCorner?: (card: CardData) => React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  card,
  size = 'md',
  rounded = true,
  shadow = true,
  disabled = false,
  selected = false,
  flipOnTap = false,
  flipDuration = 400,
  animateIn,
  onTap,
  onLongPress,
  className = '',
  style,
  renderFace,
  renderBack,
  renderCorner,
}) => {
  const platform = usePlatform();
  const dimensions = typeof size === 'string' ? SIZE_MAP[size] : size;
  const isFaceDown = card.face === Face.Down;

  const [flipped, setFlipped] = useState<boolean>(isFaceDown);

  // Sync internal flipped state with external card.face changes
  useEffect(() => {
    setFlipped(isFaceDown);
  }, [isFaceDown]);

  const handleTap = useCallback(() => {
    if (flipOnTap) {
      setFlipped(prev => !prev);
    }
    if (!disabled && onTap) onTap(card);
  }, [disabled, onTap, card, flipOnTap]);

  // Entrance animation
  const entranceDesc = useMemo(() => {
    if (animateIn !== 'deal') return null;
    return dealPreset(card.id, {
      from: { x: 0, y: -80 },
      to: { x: 0, y: 0 },
      duration: 350,
    });
  }, [animateIn, card.id]);

  const { style: entranceStyle } = useCardAnimation(entranceDesc);

  const outerStyle = useMemo((): React.CSSProperties => {
    const flipContainer = getFlipContainerStyle(platform, flipped, flipDuration);
    return {
      width: `${dimensions.width}px`,
      height: `${dimensions.height}px`,
      borderRadius: rounded ? '6px' : '0',
      boxShadow: selected
        ? '0 0 0 3px rgba(99, 179, 237, 0.7), 0 4px 12px rgba(99, 179, 237, 0.4)'
        : shadow ? '0 2px 6px rgba(0,0,0,0.3)' : 'none',
      position: 'relative' as const,
      cursor: disabled ? 'default' : 'pointer',
      opacity: disabled ? 0.5 : 1,
      ...flipContainer,
      ...style,
      ...entranceStyle,
    };
  }, [dimensions, rounded, shadow, selected, disabled, style, platform, flipped, flipDuration, entranceStyle]);

  const innerStyle = useMemo((): React.CSSProperties => {
    return getFlipInnerStyle(platform, flipped, flipDuration);
  }, [platform, flipped, flipDuration]);

  const faceStyle = useMemo((): React.CSSProperties => {
    const base = getFlipFaceStyle(platform);
    if (platform === 'rn') {
      return { ...base, opacity: flipped ? 0 : 1, transition: `opacity ${flipDuration}ms ease-in-out` };
    }
    return base;
  }, [platform, flipped, flipDuration]);

  const backStyle = useMemo((): React.CSSProperties => {
    if (platform === 'rn') {
      return {
        position: 'absolute' as const,
        top: 0, left: 0,
        width: '100%', height: '100%',
        opacity: flipped ? 1 : 0,
        transition: `opacity ${flipDuration}ms ease-in-out`,
      };
    }
    return getFlipBackStyle(platform);
  }, [platform, flipped, flipDuration]);

  const faceContent = renderFace
    ? renderFace(card)
    : <DefaultCardFace card={card} renderCorner={renderCorner} />;

  const backContent = renderBack
    ? renderBack()
    : <DefaultCardBack />;

  return (
    <View
      className={`card-engine-card ${className} ${disabled ? 'card--disabled' : ''} ${selected ? 'card--selected' : ''}`}
      style={outerStyle}
      onClick={handleTap}
      onLongPress={() => { if (!disabled && onLongPress) onLongPress(card); }}
    >
      <View style={innerStyle}>
        <View style={faceStyle}>
          {faceContent}
        </View>
        <View style={backStyle}>
          {backContent}
        </View>
      </View>
    </View>
  );
};

Card.displayName = 'Card';
