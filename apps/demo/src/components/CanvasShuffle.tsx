import React, { useRef, useEffect, useCallback } from 'react';
import { Rank, Suit, type Card as CardData } from '@card-engine/core';

// ── Card rendering constants (mirrors CardFace.tsx / CardBack.tsx) ──

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
  [Suit.Spades]: '#1a1a1a',
  [Suit.Diamonds]: '#c0392b',
  [Suit.Hearts]: '#c0392b',
};

const CARD_RADIUS = 4;
const NUM_STRIPS = 24;
const MAX_BEND_PX = 28;

// ── Drawing helpers ──

function roundedRect(
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

function renderCardFace(
  ctx: CanvasRenderingContext2D,
  w: number, h: number,
  card: CardData,
) {
  // Background
  ctx.fillStyle = '#fff';
  roundedRect(ctx, 0, 0, w, h, CARD_RADIUS);
  ctx.fill();

  // Border
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

function renderCardBack(
  ctx: CanvasRenderingContext2D,
  w: number, h: number,
) {
  // Background
  ctx.fillStyle = '#2c3e50';
  roundedRect(ctx, 0, 0, w, h, CARD_RADIUS);
  ctx.fill();

  // Border
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

// ── Bend & shadow rendering ──

function drawBentCard(
  ctx: CanvasRenderingContext2D,
  texture: HTMLCanvasElement,
  cx: number,
  cy: number,
  w: number,
  h: number,
  bendPx: number,
) {
  if (Math.abs(bendPx) < 0.5) {
    ctx.drawImage(texture, cx, cy, w, h);
    return;
  }
  const stripH = h / NUM_STRIPS;
  for (let i = 0; i < NUM_STRIPS; i++) {
    const srcY = i * stripH;
    const t = i / (NUM_STRIPS - 1);
    const profile = Math.sin(t * Math.PI);
    const offsetX = bendPx * profile;
    const overlap = 0.5;
    ctx.drawImage(
      texture,
      0, srcY, w, stripH,
      cx + offsetX, cy + srcY, w, stripH + overlap,
    );
  }
}

function drawCardShadow(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  w: number, h: number,
  altitudeRatio: number,
) {
  const baseOffset = 3;
  const maxExtra = 14;
  const offset = baseOffset + altitudeRatio * maxExtra;
  const alpha = 0.15 + altitudeRatio * 0.08;
  ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
  roundedRect(ctx, x + offset, y + offset, w, h, CARD_RADIUS);
  ctx.fill();
}

// ── Easing ──

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

// ── Component types ──

interface CanvasShuffleProps {
  cards: CardData[];
  trigger: number;
  cardWidth?: number;
  cardHeight?: number;
  faceUp?: boolean;
  canvasWidth?: number;
  canvasHeight?: number;
  staggerMs?: number;
  flightDurationMs?: number;
  arcHeightPx?: number;
  onComplete?: () => void;
}

type AnimPhase = 'idle' | 'flying' | 'settling' | 'settled';

interface FlyingCard {
  card: CardData;
  side: 'left' | 'right';
  startX: number;
  targetX: number;
  centerY: number;
  delayMs: number;
  durationMs: number;
  startWallTime: number;
  finished: boolean;
  currentX: number;
  currentY: number;
  currentBend: number;
  altitudeRatio: number;
}

interface AnimState {
  cards: FlyingCard[];
  arcHeightPx: number;
  phase: AnimPhase;
}

// ── Component ──

export const CanvasShuffle: React.FC<CanvasShuffleProps> = ({
  cards,
  trigger,
  cardWidth = 70,
  cardHeight = 100,
  faceUp = false,
  canvasWidth = 520,
  canvasHeight = 300,
  staggerMs = 130,
  flightDurationMs = 600,
  arcHeightPx = 140,
  onComplete,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef(0);
  const animStateRef = useRef<AnimState | null>(null);
  const textureCacheRef = useRef<Map<string, HTMLCanvasElement>>(new Map());
  const triggerRef = useRef(trigger);
  const settleTimerRef = useRef(0);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  // ── Texture cache ──

  const getCardTexture = useCallback(
    (card: CardData, isFaceUp: boolean, cache: Map<string, HTMLCanvasElement>): HTMLCanvasElement => {
      const key = `${card.id}-${isFaceUp ? 'up' : 'down'}-${cardWidth}x${cardHeight}`;
      let entry = cache.get(key);
      if (!entry) {
        entry = document.createElement('canvas');
        entry.width = cardWidth;
        entry.height = cardHeight;
        const ctx = entry.getContext('2d')!;
        if (isFaceUp) {
          renderCardFace(ctx, cardWidth, cardHeight, card);
        } else {
          renderCardBack(ctx, cardWidth, cardHeight);
        }
        cache.set(key, entry);
      }
      return entry;
    },
    [cardWidth, cardHeight],
  );

  // Pre-render textures when cards change
  useEffect(() => {
    const cache = textureCacheRef.current;
    for (const card of cards) {
      getCardTexture(card, faceUp, cache);
    }
  }, [cards, faceUp, getCardTexture]);

  // ── DPR setup ──

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvasWidth * dpr;
    canvas.height = canvasHeight * dpr;
    canvas.style.width = `${canvasWidth}px`;
    canvas.style.height = `${canvasHeight}px`;
    const ctx = canvas.getContext('2d')!;
    ctx.scale(dpr, dpr);
  }, [canvasWidth, canvasHeight]);

  // ── Draw settled pile ──

  const drawSettledPile = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    if (cards.length === 0) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      const ex = canvasWidth / 2 - cardWidth / 2;
      const ey = canvasHeight / 2 - cardHeight / 2;
      roundedRect(ctx, ex, ey, cardWidth, cardHeight, 6);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.font = '12px -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Empty', canvasWidth / 2, canvasHeight / 2);
    } else {
      const cache = textureCacheRef.current;
      const cx = canvasWidth / 2 - cardWidth / 2;
      const cy = canvasHeight / 2 - cardHeight / 2;
      for (let i = 0; i < cards.length; i++) {
        const tex = getCardTexture(cards[i], faceUp, cache);
        ctx.drawImage(tex, cx + i * 0.5, cy - i * 1.5, cardWidth, cardHeight);
      }
    }

    ctx.restore();
  }, [cards, faceUp, cardWidth, cardHeight, canvasWidth, canvasHeight, getCardTexture]);

  // Draw settled pile when not animating
  useEffect(() => {
    if (trigger === 0 || (animStateRef.current?.phase === 'settled')) {
      drawSettledPile();
    }
  });

  // ── Animation loop ──

  const animate = useCallback(
    (timestamp: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const state = animStateRef.current;
      if (!state || state.phase === 'idle' || state.phase === 'settled') return;

      const dpr = window.devicePixelRatio || 1;
      ctx.save();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);

      const cache = textureCacheRef.current;

      // Draw cards in order: finished first (bottom of pile), then flying (top)
      const sorted = [...state.cards].sort((a, b) => {
        if (a.finished && !b.finished) return -1;
        if (!a.finished && b.finished) return 1;
        return state.cards.indexOf(a) - state.cards.indexOf(b);
      });

      let allSettled = true;

      for (const fc of sorted) {
        if (timestamp < fc.startWallTime) {
          allSettled = false;
          continue;
        }

        let progress: number;
        if (fc.finished) {
          progress = 1;
        } else {
          const elapsed = timestamp - fc.startWallTime;
          progress = Math.min(elapsed / fc.durationMs, 1);
          if (progress < 1) allSettled = false;
        }

        const easedProgress = easeOutCubic(progress);
        fc.currentX = fc.startX + (fc.targetX - fc.startX) * easedProgress;
        fc.currentY =
          fc.centerY - state.arcHeightPx * Math.sin(progress * Math.PI);
        fc.altitudeRatio = Math.sin(progress * Math.PI);
        fc.currentBend =
          MAX_BEND_PX *
          Math.sin(progress * Math.PI) *
          (fc.side === 'left' ? 1 : -1);

        let finalX = fc.currentX;
        let finalY = fc.currentY;

        // Landing shake
        if (progress >= 0.85 && !fc.finished) {
          const settleT = (progress - 0.85) / 0.15;
          const decay = Math.max(0, 1 - settleT);
          finalX +=
            Math.sin(progress * 40) * 3 * decay * decay;
        }

        // Mark finished
        if (progress >= 1 && !fc.finished) {
          fc.finished = true;
          fc.currentX = fc.targetX;
          fc.currentY = fc.centerY;
          fc.currentBend = 0;
          finalX = fc.targetX;
          finalY = fc.centerY;
        }

        // Shadow
        drawCardShadow(
          ctx,
          finalX,
          finalY,
          cardWidth,
          cardHeight,
          fc.finished ? 0 : fc.altitudeRatio,
        );

        // Card
        const texture = getCardTexture(fc.card, faceUp, cache);
        if (fc.finished) {
          ctx.drawImage(texture, finalX, finalY, cardWidth, cardHeight);
        } else {
          drawBentCard(
            ctx,
            texture,
            finalX,
            finalY,
            cardWidth,
            cardHeight,
            fc.currentBend,
          );
        }
      }

      ctx.restore();

      // Phase transitions
      if (allSettled && state.phase === 'flying') {
        state.phase = 'settling';
        settleTimerRef.current = window.setTimeout(() => {
          state.phase = 'settled';
          drawSettledPile();
          onCompleteRef.current?.();
        }, 250);
        return;
      }

      rafRef.current = requestAnimationFrame(animate);
    },
    [cardWidth, cardHeight, faceUp, canvasWidth, canvasHeight, getCardTexture, drawSettledPile],
  );

  // ── Trigger effect ──

  useEffect(() => {
    if (trigger === 0) {
      triggerRef.current = 0;
      drawSettledPile();
      return;
    }

    if (trigger === triggerRef.current) return;
    triggerRef.current = trigger;

    // Cancel previous
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    }
    if (settleTimerRef.current) {
      clearTimeout(settleTimerRef.current);
      settleTimerRef.current = 0;
    }

    const n = cards.length;
    if (n === 0) {
      animStateRef.current = null;
      drawSettledPile();
      return;
    }

    const centerX = canvasWidth / 2 - cardWidth / 2;
    const centerY = canvasHeight / 2 - cardHeight / 2;
    const sideOffset = cardWidth + 60;

    const flyingCards: FlyingCard[] = cards.map((card, index) => ({
      card,
      side: index % 2 === 0 ? 'left' : 'right',
      startX:
        index % 2 === 0 ? -sideOffset : canvasWidth + sideOffset,
      targetX: centerX + index * 0.5,
      centerY: centerY - index * 1.5,
      delayMs: index * staggerMs,
      durationMs: flightDurationMs,
      startWallTime: 0,
      finished: false,
      currentX: 0,
      currentY: 0,
      currentBend: 0,
      altitudeRatio: 0,
    }));

    animStateRef.current = {
      cards: flyingCards,
      arcHeightPx: arcHeightPx,
      phase: 'flying',
    };

    const startTime = performance.now();
    for (const fc of flyingCards) {
      fc.startWallTime = startTime + fc.delayMs;
    }

    rafRef.current = requestAnimationFrame(animate);
  }, [trigger]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Cleanup on unmount ──

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (settleTimerRef.current) clearTimeout(settleTimerRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        display: 'block',
        borderRadius: '8px',
        backgroundColor: 'rgba(0,0,0,0.2)',
      }}
    />
  );
};

CanvasShuffle.displayName = 'CanvasShuffle';
