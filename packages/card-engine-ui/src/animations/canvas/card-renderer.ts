import type { Card as CardData } from '@card-engine/core';
import { Rank, Suit } from '@card-engine/core';

export const RANK_LABELS: Record<number, string> = {
  [Rank.Ace]: 'A',
  [Rank.Two]: '2', [Rank.Three]: '3', [Rank.Four]: '4', [Rank.Five]: '5',
  [Rank.Six]: '6', [Rank.Seven]: '7', [Rank.Eight]: '8', [Rank.Nine]: '9',
  [Rank.Ten]: '10',
  [Rank.Jack]: 'J', [Rank.Queen]: 'Q', [Rank.King]: 'K',
};

export const SUIT_SYMBOLS: Record<string, string> = {
  [Suit.Clubs]: '♣',
  [Suit.Diamonds]: '♦',
  [Suit.Hearts]: '♥',
  [Suit.Spades]: '♠',
};

export const SUIT_COLORS: Record<string, string> = {
  [Suit.Clubs]: '#1a1a1a',
  [Suit.Spades]: '#1a1a1a',
  [Suit.Diamonds]: '#c0392b',
  [Suit.Hearts]: '#c0392b',
};

export const CARD_RADIUS = 4;

export function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

export function drawCardFace(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  card: CardData,
) {
  ctx.fillStyle = '#fff';
  roundedRect(ctx, 0, 0, w, h, CARD_RADIUS);
  ctx.fill();

  ctx.strokeStyle = '#ddd';
  ctx.lineWidth = 1;
  roundedRect(ctx, 0, 0, w, h, CARD_RADIUS);
  ctx.stroke();

  const rank = card.rank;
  const suit = card.suit;

  if (rank === undefined || suit === undefined) {
    ctx.fillStyle = '#999';
    ctx.font = '20px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('?', w / 2, h / 2);
    return;
  }

  const color = SUIT_COLORS[suit] ?? '#1a1a1a';
  const label = RANK_LABELS[rank] ?? '?';
  const symbol = SUIT_SYMBOLS[suit] ?? '?';
  const pad = Math.max(5, w * 0.07);

  // Top-left corner
  ctx.fillStyle = color;
  ctx.font = `bold ${Math.round(w * 0.2)}px -apple-system, sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(label, pad, pad);
  ctx.font = `${Math.round(w * 0.14)}px -apple-system, sans-serif`;
  ctx.fillText(symbol, pad, pad + Math.round(w * 0.22));

  // Center symbol (watermark)
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.3;
  ctx.font = `${Math.round(w * 0.55)}px -apple-system, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(symbol, w / 2, h / 2);
  ctx.globalAlpha = 1;

  // Bottom-right corner (inverted)
  ctx.fillStyle = color;
  ctx.font = `bold ${Math.round(w * 0.2)}px -apple-system, sans-serif`;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'bottom';
  ctx.fillText(label, w - pad, h - pad);
  ctx.font = `${Math.round(w * 0.14)}px -apple-system, sans-serif`;
  ctx.fillText(symbol, w - pad, h - pad - Math.round(w * 0.22));
}

export function drawCardBack(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
) {
  ctx.fillStyle = '#2c3e50';
  roundedRect(ctx, 0, 0, w, h, CARD_RADIUS);
  ctx.fill();

  ctx.strokeStyle = '#1a252f';
  ctx.lineWidth = 1;
  roundedRect(ctx, 0, 0, w, h, CARD_RADIUS);
  ctx.stroke();

  // Outer diamond
  const outerW = w * 0.8;
  const outerH = h * 0.8;
  const outerX = (w - outerW) / 2;
  const outerY = (h - outerH) / 2;

  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.lineWidth = 2;
  ctx.strokeRect(outerX, outerY, outerW, outerH);

  // Inner rotated diamond
  const innerW = outerW * 0.5;
  const innerH = outerH * 0.5;
  const innerX = (w - innerW) / 2;
  const innerY = (h - innerH) / 2;

  ctx.strokeStyle = 'rgba(255,255,255,0.1)';
  ctx.translate(w / 2, h / 2);
  ctx.rotate(Math.PI / 4);
  ctx.strokeRect(-innerW / 2, -innerH / 2, innerW, innerH);
  ctx.restore();
}
