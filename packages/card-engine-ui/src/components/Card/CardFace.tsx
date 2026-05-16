import React from 'react';
import { View, Text } from '@tarojs/components';
import type { Card as CardData } from '@card-engine/core';
import { Rank, Suit } from '@card-engine/core';

const RANK_LABELS: Record<number, string> = {
  [Rank.Ace]: 'A',
  [Rank.Two]: '2', [Rank.Three]: '3', [Rank.Four]: '4', [Rank.Five]: '5',
  [Rank.Six]: '6', [Rank.Seven]: '7', [Rank.Eight]: '8', [Rank.Nine]: '9',
  [Rank.Ten]: '10',
  [Rank.Jack]: 'J', [Rank.Queen]: 'Q', [Rank.King]: 'K',
};

const SUIT_SYMBOLS: Record<string, string> = {
  [Suit.Clubs]: '♣',
  [Suit.Diamonds]: '♦',
  [Suit.Hearts]: '♥',
  [Suit.Spades]: '♠',
};

const SUIT_COLORS: Record<string, string> = {
  [Suit.Clubs]: '#1a1a1a',
  [Suit.Diamonds]: '#c0392b',
  [Suit.Hearts]: '#c0392b',
  [Suit.Spades]: '#1a1a1a',
};

interface CardFaceProps {
  card: CardData;
  renderCorner?: (card: CardData) => React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}

export const CardFace: React.FC<CardFaceProps> = ({ card, renderCorner, style, className = '' }) => {
  const rank = card.rank;
  const suit = card.suit;
  const color = suit ? SUIT_COLORS[suit] ?? '#1a1a1a' : '#1a1a1a';

  if (renderCorner) {
    return (
      <View className={className} style={{ width: '100%', height: '100%', position: 'relative', ...style }}>
        {renderCorner(card)}
      </View>
    );
  }

  if (rank === undefined || suit === undefined) {
    return (
      <View className={className} style={{
        width: '100%', height: '100%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backgroundColor: '#fff', borderRadius: '4px',
        ...style,
      }}>
        <Text style={{ fontSize: '20px', color: '#999' }}>?</Text>
      </View>
    );
  }

  const label = RANK_LABELS[rank] ?? '?';
  const symbol = SUIT_SYMBOLS[suit] ?? '?';

  return (
    <View className={className} style={{
      width: '100%', height: '100%',
      backgroundColor: '#fff',
      borderRadius: '4px',
      border: '1px solid #ddd',
      display: 'flex',
      flexDirection: 'column',
      padding: '4px',
      boxSizing: 'border-box',
      position: 'relative',
      ...style,
    }}>
      {/* Top-left corner */}
      <View style={{ alignItems: 'flex-start' }}>
        <Text style={{ fontSize: '14px', fontWeight: 'bold', color, lineHeight: 1 }}>{label}</Text>
        <Text style={{ fontSize: '10px', color, lineHeight: 1 }}>{symbol}</Text>
      </View>

      {/* Center symbol */}
      <View style={{
        flex: 1, display: 'flex',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <Text style={{ fontSize: '40px', color, opacity: 0.3 }}>{symbol}</Text>
      </View>

      {/* Bottom-right corner (inverted) */}
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={{ fontSize: '14px', fontWeight: 'bold', color, lineHeight: 1 }}>{label}</Text>
        <Text style={{ fontSize: '10px', color, lineHeight: 1 }}>{symbol}</Text>
      </View>
    </View>
  );
};

CardFace.displayName = 'CardFace';
